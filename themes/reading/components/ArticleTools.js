import { siteConfig } from '@/lib/config'
import { useEffect, useRef, useState } from 'react'
import CONFIG from '../config'
import { PageLink, postDay } from './Frame'

/**
 * 文章页的小工具：字号、复制链接、阅读量、过时提示、最近评论、脚注
 * 都只在 effect 里碰 window / localStorage / 网络，渲染结果只看 props，SSR 和首帧一致
 */

const SIZE_KEY = 'reading-font-size'
const SIZES = [
  ['s', '小'],
  ['m', '中'],
  ['l', '大']
]

/** 首帧前把保存的字号写到 <html data-reading-size>，免得先按默认字号排一遍再跳 */
export const FontSizeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `try{var s=localStorage.getItem('${SIZE_KEY}');if(s==='s'||s==='l')document.documentElement.dataset.readingSize=s}catch(e){}`
    }}
  />
)

/** 正文字号：小 / 中 / 大，存 localStorage；默认档不写属性，没 JS 时就是 CSS 里的默认字号 */
export const FontSizeControl = ({ className = '' }) => {
  const [size, setSize] = useState('m')
  useEffect(() => {
    setSize(document.documentElement.dataset.readingSize || 'm')
  }, [])
  const choose = s => {
    setSize(s)
    const root = document.documentElement
    if (s === 'm') delete root.dataset.readingSize
    else root.dataset.readingSize = s
    try {
      if (s === 'm') localStorage.removeItem(SIZE_KEY)
      else localStorage.setItem(SIZE_KEY, s)
    } catch {}
  }
  return (
    <div className={`font-size ${className}`} role='group' aria-label='正文字号'>
      <span aria-hidden='true'>字号</span>
      {SIZES.map(([key, label]) => (
        <button key={key} type='button' aria-pressed={size === key} aria-label={`正文字号：${label}`} onClick={() => choose(key)}>
          {label}
        </button>
      ))}
    </div>
  )
}

/** 复制链接：等剪贴板真的写进去才说「已复制」；被浏览器拒绝时露出地址让人手动复制。支持系统分享时多一个「分享」 */
export const ShareLink = ({ url, title }) => {
  const [state, setState] = useState('')
  const [canShare, setCanShare] = useState(false)
  const timer = useRef(0)
  useEffect(() => {
    setCanShare(typeof navigator.share === 'function')
    return () => clearTimeout(timer.current)
  }, [])
  const copy = async () => {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(url)
      setState('ok')
      timer.current = setTimeout(() => setState(''), 2000)
    } catch {
      setState('fail')
    }
  }
  const share = async () => {
    try {
      await navigator.share({ title, url })
    } catch {}
  }
  return (
    <div className='share-row'>
      <button type='button' onClick={copy}>
        {state === 'ok' ? '已复制' : '复制链接'}
      </button>
      {canShare && (
        <button type='button' onClick={share}>
          分享
        </button>
      )}
      {state === 'fail' && (
        <input readOnly value={url} aria-label='文章链接，浏览器不让自动复制，请手动复制' autoFocus onFocus={e => e.target.select()} />
      )}
      <span className='sr-only' role='status'>
        {state === 'ok' ? '链接已复制' : ''}
      </span>
    </div>
  )
}

const walineServer = () => String(siteConfig('COMMENT_WALINE_SERVER_URL') || '').replace(/\/$/, '')

/** 阅读量：用 Waline 的文章计数，每次打开 +1；请求失败或没有数就什么都不显示。
 *  数字回来之前先占好位置（看不见），手机上 byline 不会因为它晚到而折行把正文往下推 */
export const PageViews = ({ path }) => {
  const [count, setCount] = useState(0)
  const sent = useRef('')
  useEffect(() => {
    const server = walineServer()
    if (!server || !path || sent.current === path) return
    sent.current = path
    let alive = true
    fetch(`${server}/api/article`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path, type: 'time', action: 'inc' })
    })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        const data = Array.isArray(json?.data) ? json.data[0] : json?.data
        const n = Number(typeof data === 'object' ? data?.time : data)
        if (alive && n > 0) setCount(n)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [path])
  if (!walineServer()) return null
  return (
    <span className='pageviews' style={count > 0 ? undefined : { visibility: 'hidden' }} aria-hidden={count > 0 ? undefined : true}>
      阅读 {count > 0 ? count.toLocaleString() : '00'}
    </span>
  )
}

/**
 * 过时提示：只给技术文，发布满一年才出现。按生成时刻算（buildTime），不按迁移带来的编辑时间
 */
export const StaleNote = ({ post, buildTime }) => {
  const category = siteConfig('READING_STALE_CATEGORY', '技术分享', CONFIG)
  if (!buildTime || !post?.publishDate || post.category !== category) return null
  const days = (buildTime - post.publishDate) / 86400000
  if (days < 365) return null
  const [y, m] = String(postDay(post)).split('-')
  const years = Math.floor(days / 365)
  return (
    <p className='stale-note' role='note'>
      这篇写于 {y} 年 {Number(m)} 月，距今{years >= 2 ? ` ${years} 年` : '一年多'}。里面的版本、命令和界面可能已经变了，照着做之前先对一下官方文档。
    </p>
  )
}

/** 最近评论：评论区附近才去拉；只列本站文章下、不是当前这篇的公开评论，纯文本显示 */
export const RecentComments = ({ path }) => {
  const ref = useRef(null)
  const [items, setItems] = useState(null)
  useEffect(() => {
    const server = walineServer()
    if (!server || !ref.current) return
    let alive = true
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(e => e.isIntersecting)) return
        observer.disconnect()
        fetch(`${server}/api/comment?type=recent&count=20`)
          .then(r => (r.ok ? r.json() : null))
          .then(json => {
            const list = (Array.isArray(json?.data) ? json.data : [])
              .filter(c => c.status === 'approved' && /^\/article\//.test(c.url || '') && c.url !== path)
              .slice(0, 5)
              .map(c => ({
                id: c.objectId,
                nick: c.nick || '匿名',
                url: c.url,
                time: c.time,
                text: String(c.orig || '').replace(/\s+/g, ' ').trim().slice(0, 60)
              }))
            if (alive) setItems(list)
          })
          .catch(() => {})
      },
      { rootMargin: '400px 0px' }
    )
    observer.observe(ref.current)
    return () => {
      alive = false
      observer.disconnect()
    }
  }, [path])
  return (
    <section ref={ref} className='recent-comments' aria-label='最近评论' hidden={!items?.length}>
      {items?.length > 0 && (
        <>
          <h2>最近评论</h2>
          <ul>
            {items.map(c => (
              <li key={c.id}>
                <PageLink href={`${c.url}#${c.id}`}>
                  <strong>{c.nick}</strong>
                  <span>{c.text}</span>
                </PageLink>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/**
 * 脚注：Notion 里正文写 [^1]，文末单独一段写「[^1]: 说明」。
 * 有定义才转换：引用变成上标链接，定义段加编号和「↩」返回链接（同一脚注引用几次就有几个）。
 * 只动 .notion-text 里的文字节点，跳过代码和链接；没 JS 时原样显示方括号文字
 */
export const useFootnotes = key => {
  useEffect(() => {
    const root = document.getElementById('article-wrapper')
    if (!key || !root) return
    const prefix = /^\s*\[\^([\w-]+)\]:\s*/
    const blocks = [...root.querySelectorAll('.notion-text')]
    const defs = new Map()
    for (const el of blocks) {
      const m = el.textContent.match(prefix)
      if (m && !defs.has(m[1])) defs.set(m[1], el)
    }
    if (defs.size === 0) return
    const defEls = new Set(defs.values())
    const order = []
    const uses = {}
    for (const el of blocks) {
      if (defEls.has(el)) continue
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const nodes = []
      while (walker.nextNode()) nodes.push(walker.currentNode)
      for (const node of nodes) {
        if (node.parentElement?.closest('code, a')) continue
        const text = node.nodeValue
        const re = /\[\^([\w-]+)\]/g
        const frag = document.createDocumentFragment()
        let last = 0
        let m
        while ((m = re.exec(text))) {
          const name = m[1]
          if (!defs.has(name)) continue
          if (!order.includes(name)) order.push(name)
          uses[name] = (uses[name] || 0) + 1
          frag.append(text.slice(last, m.index))
          const sup = document.createElement('sup')
          sup.className = 'fn-ref'
          const a = document.createElement('a')
          a.href = `#fn-${name}`
          a.id = `fnref-${name}-${uses[name]}`
          a.textContent = `[${order.indexOf(name) + 1}]`
          a.setAttribute('aria-label', `脚注 ${order.indexOf(name) + 1}`)
          sup.append(a)
          frag.append(sup)
          last = m.index + m[0].length
        }
        if (last > 0) {
          frag.append(text.slice(last))
          node.replaceWith(frag)
        }
      }
    }
    for (const [name, el] of defs) {
      el.id = `fn-${name}`
      el.classList.add('fn-def')
      const first = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode()
      if (first) first.nodeValue = first.nodeValue.replace(prefix, '')
      const num = document.createElement('span')
      num.className = 'fn-num'
      num.textContent = order.includes(name) ? `${order.indexOf(name) + 1}.` : '·'
      el.prepend(num)
      for (let i = 1; i <= (uses[name] || 0); i++) {
        const back = document.createElement('a')
        back.href = `#fnref-${name}-${i}`
        back.className = 'fn-back'
        back.textContent = '↩'
        back.setAttribute('aria-label', `回到第 ${i} 处引用`)
        el.append(' ', back)
      }
    }
  }, [key])
}

/** 首发出处：Notion 的 source_url（网址属性）。按域名认出平台，认不出就显示域名 */
const SOURCE_SITES = [
  [/(^|\.)csdn\.net$/, 'CSDN'],
  [/(^|\.)cnblogs\.com$/, '博客园'],
  [/^mp\.weixin\.qq\.com$/, '公众号'],
  [/(^|\.)hllqk\.cn$|^hllqkb\.github\.io$/, '旧博客']
]
export const sourceOf = post => {
  const raw = Array.isArray(post?.source_url) ? post.source_url[0] : post?.source_url
  if (!raw || !/^https?:\/\//.test(raw)) return null
  let host = ''
  try {
    host = new URL(raw).hostname
  } catch {
    return null
  }
  const label = SOURCE_SITES.find(([re]) => re.test(host))?.[1] || host.replace(/^www\./, '')
  return { label, url: raw }
}

export const SourceNote = ({ source }) =>
  source ? (
    <p className='source-note'>
      首发于 {source.label}
      <span aria-hidden='true'>·</span>
      <a href={source.url} target='_blank' rel='noopener noreferrer'>
        原文链接<span aria-hidden='true'> ↗</span>
      </a>
    </p>
  ) : null

/**
 * 正文图片：加载完之前垫纸色底，加载失败换成「图片加载失败」占位（不再能点开放大）。
 * error 事件不冒泡，用捕获阶段在 #article-wrapper 上统一接；挂载前已经失败的图在挂载时补查一遍
 */
export const useImageFallback = key => {
  useEffect(() => {
    const root = document.getElementById('article-wrapper')
    if (!key || !root) return
    const isTarget = img => img?.tagName === 'IMG' && img.closest('.notion-asset-wrapper-image, .photo-frame') && !img.closest('.medium-zoom-overlay')
    const ready = img => img.classList.add('img-ready')
    const broken = img => {
      img.classList.add('img-broken')
      img.removeAttribute('tabindex')
      img.closest('.notion-asset-wrapper-image, .photo-frame')?.classList.add('has-broken-img')
    }
    const onLoad = e => isTarget(e.target) && ready(e.target)
    const onError = e => isTarget(e.target) && broken(e.target)
    root.querySelectorAll('.notion-asset-wrapper-image img, .photo-frame img').forEach(img => {
      if (!img.complete) return
      if (img.naturalWidth > 0) ready(img)
      else broken(img)
    })
    root.addEventListener('load', onLoad, true)
    root.addEventListener('error', onError, true)
    return () => {
      root.removeEventListener('load', onLoad, true)
      root.removeEventListener('error', onError, true)
    }
  }, [key])
}

/**
 * 正文图片放大（medium-zoom）的键盘支持：
 * - 图片能 Tab 到，回车 / 空格打开；
 * - 打开后焦点移到放大的那张图上（原图会被设成 visibility: hidden，焦点不移走就掉到 body）；
 * - 打开期间 Tab 只停在放大图上，不会跑到被遮住的正文；Esc 在 document 上接，焦点在哪都能关；
 * - 关闭后焦点回到原图。
 * 打开状态按 medium-zoom 自己派发的 open / closed 事件记，不看 body 上的 class（那个要等下一帧才加）
 */
export const useZoomKeyboard = key => {
  useEffect(() => {
    const root = document.getElementById('article-wrapper')
    if (!key || !root) return
    // react-notion-x 在图片挂载时才接上 medium-zoom，这里先全部设成可聚焦，按键时再看有没有接上
    root.querySelectorAll('.notion-asset-wrapper-image img:not(.img-broken)').forEach(img => {
      img.tabIndex = 0
      img.setAttribute('role', 'button')
      img.setAttribute('aria-label', img.alt && img.alt !== 'notion image' ? `放大图片：${img.alt}` : '放大图片')
    })
    let active = null
    let focusTimer = 0
    const zoomed = () => document.querySelector('.medium-zoom-image--opened')
    const focusZoomed = () => {
      const el = zoomed()
      if (!el) return false
      // 放大图是原图的克隆，会把原图的 aria-label 一起抄过去，这里改成关闭的说法
      el.tabIndex = -1
      el.setAttribute('role', 'button')
      el.setAttribute('aria-label', '关闭放大的图片（Esc）')
      el.focus({ preventScroll: true })
      return true
    }
    const restore = () => {
      if (!active) return
      const { original } = active
      active = null
      clearTimeout(focusTimer)
      if (original.isConnected) original.focus({ preventScroll: true })
    }
    const close = () => {
      if (!active) return
      const { zoom } = active
      if (zoom?.close) void zoom.close()
      else zoomed()?.click()
      // 关闭动画的 transitionend 没来时 medium-zoom 不发 closed，放大图没了就自己把焦点还回去
      setTimeout(() => {
        if (active && !zoomed()) restore()
      }, 600)
    }
    const onKey = e => {
      // 放大图已经没了（鼠标点掉、滚动关掉，但 closed 没来）就当已关闭，别继续拦 Tab
      if (active && !zoomed()) restore()
      if (active) {
        if (e.key === 'Escape' || e.key === 'Esc') {
          e.preventDefault()
          close()
        } else if (e.key === 'Tab') {
          e.preventDefault()
          focusZoomed()
        } else if ((e.key === 'Enter' || e.key === ' ') && e.target === zoomed()) {
          e.preventDefault()
          close()
        }
        return
      }
      const img = e.target
      if ((e.key === 'Enter' || e.key === ' ') && img?.classList?.contains('medium-zoom-image') && root.contains(img)) {
        e.preventDefault()
        img.click()
      }
    }
    const onOpen = e => {
      if (!root.contains(e.target)) return
      active = { zoom: e.detail?.zoom, original: e.target }
      // open 事件在克隆放大图之前派发，等克隆出来再把焦点移过去
      let tries = 0
      const tryFocus = () => {
        if (!active || focusZoomed() || ++tries > 20) return
        focusTimer = setTimeout(tryFocus, 16)
      }
      focusTimer = setTimeout(tryFocus, 0)
    }
    const onClosed = e => {
      if (active && e.target === active.original) restore()
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('medium-zoom:open', onOpen, true)
    document.addEventListener('medium-zoom:closed', onClosed, true)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('medium-zoom:open', onOpen, true)
      document.removeEventListener('medium-zoom:closed', onClosed, true)
    }
  }, [key])
}
