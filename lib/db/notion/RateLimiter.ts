import fs from 'fs'

interface QueueItem<T> {
  requestFunc: () => Promise<T>
  resolve: (value: T) => void
  reject: (err: unknown) => void
}

interface NodeError extends Error {
  code?: string
}

/**
 * 构建期 Notion 请求限流。
 * concurrency 个锁文件槽位跨 Next.js 构建 worker 共享，全局同时在途的请求不超过 concurrency；
 * concurrency=1 时与旧版一致：全局串行，相邻请求间隔 minIntervalMs。
 */
export class RateLimiter {
  private queue: QueueItem<unknown>[] = []
  private active = 0
  private pumping = false
  private lastRequestTime = 0
  private requestCount = 0
  private windowStart = Date.now()

  constructor(
    private maxRequestsPerMinute = 200,
    private lockFilePath?: string,
    private minIntervalMs = 300,
    private concurrency = 1
  ) { }

  private slotPath(slot: number) {
    return this.concurrency === 1
      ? this.lockFilePath!
      : `${this.lockFilePath}.${slot}`
  }

  private removeStaleLock(file: string) {
    // 如果锁文件存在且创建时间过久，认为是陈旧锁，直接删除
    try {
      const age = Date.now() - fs.statSync(file).ctimeMs
      if (age > 30 * 1000) { // 30秒
        fs.unlinkSync(file)
        console.warn('[限流] 删除陈旧锁文件:', file)
      }
    } catch (err) {
      const e = err as NodeError
      if (e.code !== 'ENOENT') console.error('[限流] 删除陈旧锁失败:', err)
    }
  }

  private async acquireSlot(): Promise<number> {
    if (!this.lockFilePath) return -1
    while (true) {
      for (let slot = 0; slot < this.concurrency; slot++) {
        const file = this.slotPath(slot)
        this.removeStaleLock(file)
        try {
          fs.writeFileSync(file, process.pid.toString(), { flag: 'wx' })
          return slot
        } catch (err) {
          const e = err as NodeError
          if (e.code !== 'EEXIST') throw err
        }
      }
      await new Promise(res => setTimeout(res, 100))
    }
  }

  private releaseSlot(slot: number) {
    if (slot < 0) return
    try { fs.unlinkSync(this.slotPath(slot)) }
    catch (err) {
      const e = err as NodeError
      if (e.code !== 'ENOENT') console.error('释放锁失败', err)
    }
  }

  private async waitForBudget() {
    const now = Date.now()
    const elapsed = now - this.windowStart

    if (elapsed > 60_000) { this.requestCount = 0; this.windowStart = now }
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60_000 - elapsed + 100
      await new Promise(res => setTimeout(res, waitTime))
      this.requestCount = 0
      this.windowStart = Date.now()
    }

    // lastRequestTime 在请求开始和结束时都会刷新：串行时等价于「上一个请求结束后再隔 minIntervalMs」
    const waitTime = Math.max(
      0,
      this.minIntervalMs - (Date.now() - this.lastRequestTime)
    )
    if (waitTime > 0) await new Promise(res => setTimeout(res, waitTime))

    this.lastRequestTime = Date.now()
    this.requestCount++
  }

  public enqueue<T>(_key: string, requestFunc: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        requestFunc: requestFunc as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject
      })
      this.pump()
    })
  }

  private pump() {
    if (this.pumping) return
    this.pumping = true
    // drain 是 async 但这里不 await，异常在内部兜底
    void this.drain()
  }

  private async drain() {
    try {
      while (this.queue.length > 0 && this.active < this.concurrency) {
        const slot = await this.acquireSlot()
        await this.waitForBudget()
        const item = this.queue.shift()
        if (!item) { this.releaseSlot(slot); break }
        this.active++
        void this.run(item, slot)
      }
    } catch (err) {
      console.error('限流队列异常', err)
      setTimeout(() => this.pump(), 100)
    } finally {
      this.pumping = false
    }
  }

  private async run(item: QueueItem<unknown>, slot: number) {
    try {
      item.resolve(await item.requestFunc())
    } catch (err) {
      item.reject(err)
    } finally {
      this.lastRequestTime = Date.now()
      this.active--
      this.releaseSlot(slot)
      this.pump()
    }
  }
}
