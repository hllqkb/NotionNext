/**
 * @jest-environment node
 */

import { onRequest } from '../../functions/img/[[path]].js'

const BLOCK_ID = '3ab487c8-7fd8-80df-b976-e74078232d32'
const OTHER_ID = '11111111-2222-3333-4444-555555555555'
const ATTACHMENT = 'attachment:89da7f2e-0215-4515-8cc8-204d6646257f:a.png'
const ORIGIN = 'https://blog.example.com'

const store = new Map()
const waits = []

beforeAll(() => {
  global.caches = {
    default: {
      match: jest.fn(async req => store.get(req.url)?.clone()),
      put: jest.fn(async (req, res) => {
        store.set(req.url, res)
      })
    }
  }
})

beforeEach(() => {
  store.clear()
  waits.length = 0
  global.fetch = jest.fn(
    async () =>
      new Response('png-bytes', {
        status: 200,
        headers: { 'content-type': 'image/png', 'set-cookie': 'x=1' }
      })
  )
})

const env = {
  ASSETS: {
    fetch: jest.fn(async () => new Response(JSON.stringify([BLOCK_ID])))
  }
}

const call = (path, method = 'GET') =>
  onRequest({
    request: new Request(`${ORIGIN}${path}`, { method }),
    env,
    waitUntil: p => waits.push(p)
  })

const imgPath = (id = BLOCK_ID, src = ATTACHMENT, table = 'block') =>
  `/img/${table}/${id}?src=${encodeURIComponent(src)}`

describe('functions/img 图片代理', () => {
  it('首次回源并缓存，第二次命中缓存', async () => {
    const first = await call(imgPath())
    expect(first.status).toBe(200)
    expect(first.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable'
    )
    expect(first.headers.get('x-img-proxy-cache')).toBe('MISS')
    expect(first.headers.get('set-cookie')).toBeNull()
    expect(first.headers.get('content-security-policy')).toContain('sandbox')
    expect(await first.text()).toBe('png-bytes')
    expect(global.fetch.mock.calls[0][0]).toBe(
      `https://www.notion.so/image/${encodeURIComponent(ATTACHMENT)}?table=block&id=${BLOCK_ID}&cache=v2`
    )
    await Promise.all(waits)

    const second = await call(imgPath())
    expect(second.headers.get('x-img-proxy-cache')).toBe('HIT')
    expect(await second.text()).toBe('png-bytes')
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('签名参数不同仍命中同一缓存', async () => {
    const s3 =
      'https://prod-files-secure.s3.us-west-2.amazonaws.com/a/b/c.png?X-Amz-Signature='
    await call(imgPath(BLOCK_ID, `${s3}1`))
    await Promise.all(waits)
    const res = await call(imgPath(BLOCK_ID, `${s3}2`))
    expect(res.headers.get('x-img-proxy-cache')).toBe('HIT')
  })

  it.each([
    ['非法 id', imgPath('not-a-uuid')],
    ['外站图片', imgPath(BLOCK_ID, 'https://evil.example.com/a.png')],
    ['不认识的 table', imgPath(BLOCK_ID, ATTACHMENT, 'space')],
    ['缺 src', `/img/block/${BLOCK_ID}`],
    ['不在白名单的 blockId', imgPath(OTHER_ID)]
  ])('%s 返回 403 且不回源', async (_, path) => {
    const res = await call(path)
    expect(res.status).toBe(403)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('上游失败返回 502 且不缓存', async () => {
    global.fetch = jest.fn(async () => new Response('nope', { status: 500 }))
    const res = await call(imgPath())
    expect(res.status).toBe(502)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(store.size).toBe(0)
  })

  it('上游返回非图片也按 502 处理', async () => {
    global.fetch = jest.fn(
      async () =>
        new Response('<html>', { headers: { 'content-type': 'text/html' } })
    )
    expect((await call(imgPath())).status).toBe(502)
  })

  it('只接受 GET / HEAD', async () => {
    expect((await call(imgPath(), 'POST')).status).toBe(405)
    const head = await call(imgPath(), 'HEAD')
    expect(head.status).toBe(200)
    expect(head.headers.get('content-type')).toBe('image/png')
  })
})
