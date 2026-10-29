import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import CONFIG from '../config'

/**
 * 站内链接一律用原生 a 整页跳转：页面都是静态 HTML，Next Link 会在视口内和悬停时
 * 预取 /_next/data 的 JSON，跟首屏资源抢带宽，点击后还要等 JSON 才能换页
 */
/* eslint-disable @next/next/no-html-link-for-pages */
export const PageLink = ({ href, children, ...rest }) => {
  const external = /^https?:\/\//.test(href || '') && !href.startsWith(siteConfig('LINK'))
  return external
    ? <a href={href} target='_blank' rel='noopener noreferrer' {...rest}>{children}</a>
    : <a href={href} {...rest}>{children}</a>
}

/** 页头：站名 + 导航 + 深浅色切换 */
export const Masthead = ({ siteInfo }) => {
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useGlobal()
  const path = router.asPath || '/'
  const links = [
    { href: '/', label: '文章', match: p => p === '/' || p.startsWith('/page') },
    { href: '/archive', label: '归档', match: p => p.startsWith('/archive') },
    { href: '/category', label: '分类', match: p => p.startsWith('/category'), wide: true },
    { href: '/tag', label: '标签', match: p => p.startsWith('/tag'), wide: true },
    { href: '/about', label: '关于', match: p => p.startsWith('/about') }
  ]
  // 「更多」里的独立页面；窄屏时分类、标签也收进来
  const more = [
    { href: '/projects', label: '项目' },
    { href: '/gallery', label: '相册' },
    { href: '/books', label: '书影' },
    { href: '/links', label: '友链' },
    { href: '/skills', label: 'Skills' }
  ]
  const narrowOnly = links.filter(l => l.wide)
  const moreActive = more.some(l => path.startsWith(l.href))
  const moreRef = useRef(null)
  // 点菜单外面或按 Esc 收起
  useEffect(() => {
    const close = e => {
      const el = moreRef.current
      if (!el?.open) return
      if (e.type === 'keydown' ? e.key === 'Escape' : !el.contains(e.target)) el.open = false
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', close)
    }
  }, [])
  return (
    <header className='masthead'>
      <PageLink className='brand' href='/'>
        {siteConfig('TITLE') || siteInfo?.title}
        <span className='brand-dot' aria-hidden='true' />
      </PageLink>
      <nav aria-label='主导航'>
        {links.map(l => (
          <PageLink key={l.href} href={l.href} className={`${l.match(path) ? 'active' : ''}${l.wide ? ' nav-wide' : ''}`}>
            {l.label}
          </PageLink>
        ))}
        <details className='nav-more' ref={moreRef}>
          <summary className={moreActive ? 'active' : ''}>更多</summary>
          <div className='nav-more-panel'>
            {narrowOnly.map(l => (
              <PageLink key={l.href} href={l.href} className={`nav-narrow${l.match(path) ? ' active' : ''}`}>
                {l.label}
              </PageLink>
            ))}
            {more.map(l => (
              <PageLink key={l.href} href={l.href} className={path.startsWith(l.href) ? 'active' : ''}>
                {l.label}
              </PageLink>
            ))}
          </div>
        </details>
        <button type='button' onClick={toggleDarkMode} aria-label='切换深浅色'>
          {isDarkMode ? '浅色' : '深色'}
        </button>
      </nav>
    </header>
  )
}

/** RSS 图标 */
const RssIcon = () => (
  <svg className='rss-icon' viewBox='0 0 16 16' width='13' height='13' aria-hidden='true'>
    <circle cx='3' cy='13' r='1.8' fill='currentColor' />
    <path d='M1.5 7.2a7.3 7.3 0 0 1 7.3 7.3M1.5 2.2a12.3 12.3 0 0 1 12.3 12.3' fill='none' stroke='currentColor' strokeWidth='1.9' strokeLinecap='round' />
  </svg>
)

/** 页脚 */
export const SiteFooter = ({ siteInfo }) => (
  <footer className='site-footer'>
    <span>
      {siteConfig('TITLE') || siteInfo?.title} · © {new Date().getFullYear()} {siteConfig('AUTHOR')}
    </span>
    <span className='footer-right'>
      {siteConfig('ENABLE_RSS') && (
        <a className='rss-link' href='/rss/feed.xml' type='application/rss+xml' title='RSS 订阅'>
          <RssIcon />
          订阅
        </a>
      )}
      {siteConfig('READING_FOOTER_RIGHT', null, CONFIG)}
    </span>
  </footer>
)

/** 文章日期：优先发布日期 */
export const postDay = post => {
  if (post?.publishDay) return post.publishDay
  if (post?.date?.start_date) return post.date.start_date
  // allNavPages 只有毫秒时间戳 publishDate，按北京时间转成 YYYY-MM-DD
  if (post?.publishDate) return new Date(post.publishDate).toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
  return post?.createdTime || ''
}

/** 最后编辑时间（毫秒），没有就退回发布时间 */
export const updatedAt = post => Date.parse(post?.lastEditedDate) || post?.publishDate || 0

/** 最后编辑日期 YYYY-MM-DD，按北京时间 */
export const updatedDay = post => {
  const t = updatedAt(post)
  return t ? new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }) : String(postDay(post))
}

/** 按年分组，年份倒序、组内按发布时间倒序 */
export const groupByYear = posts => {
  const groups = {}
  for (const p of posts || []) {
    const y = String(postDay(p)).slice(0, 4) || '其他'
    ;(groups[y] = groups[y] || []).push(p)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, list]) => ({
      year,
      list: list.sort((a, b) => (b.publishDate || 0) - (a.publishDate || 0))
    }))
}

/** 文章是否设置了自己的封面（排除 NotionNext 的默认占位图） */
export const hasCover = post => {
  const src = post?.pageCoverThumbnail
  return !!src && !/bg_image|HOME_BANNER/.test(src) && src !== siteConfig('HOME_BANNER_IMAGE')
}

/** 印章：朱红方印。中文取前两个字竖排，英文（如 hllqk）横排 */
export const Seal = ({ text }) => {
  const raw = String(text || '').trim()
  const latin = /^[\x00-\x7F]+$/.test(raw)
  return (
    <span className={`seal${latin ? ' seal-latin' : ''}`} aria-hidden='true'>
      {latin ? raw.slice(0, 8) : raw.slice(0, 2)}
    </span>
  )
}

/** 写作打卡：最近 26 周，每周一个点，写过文章的周点亮，颜色随篇数加深 */
export const WritingStreak = ({ pages = [], buildTime }) => {
  const WEEKS = 26
  const week = 7 * 24 * 3600 * 1000
  // 静态 HTML 和 hydration 首帧用构建时刻，挂载后再换成访问时的当前时间
  const [now, setNow] = useState(buildTime || null)
  useEffect(() => setNow(Date.now()), [])
  if (!now) return null
  const counts = new Array(WEEKS).fill(0)
  for (const p of pages) {
    const t = p.publishDate || Date.parse(postDay(p))
    if (!t) continue
    const ago = Math.floor((now - t) / week)
    if (ago >= 0 && ago < WEEKS) counts[WEEKS - 1 - ago]++
  }
  const total = counts.reduce((a, b) => a + b, 0)
  let streak = 0
  for (let i = WEEKS - 1; i >= 0 && counts[i] > 0; i--) streak++
  return (
    <div className='streak reveal' aria-label={`近 ${WEEKS} 周写了 ${total} 篇`}>
      <div className='streak-label'>
        写作打卡
        <small>
          近半年 {total} 篇{streak > 1 ? ` · 连续 ${streak} 周` : ''}
        </small>
      </div>
      <div className='dots'>
        {counts.map((n, i) => (
          <span key={i} className={`dot level-${Math.min(n, 3)}${i === WEEKS - 1 ? ' this-week' : ''}`} title={`${WEEKS - 1 - i === 0 ? '本周' : `${WEEKS - 1 - i} 周前`}：${n} 篇`} />
        ))}
      </div>
    </div>
  )
}

/** 加密文章的小锁 */
export const LockIcon = () => (
  <svg className='lock' viewBox='0 0 16 16' width='14' height='14' aria-label='需要密码' role='img'>
    <path d='M4.5 7V5a3.5 3.5 0 0 1 7 0v2' fill='none' stroke='currentColor' strokeWidth='1.4' />
    <rect x='3' y='7' width='10' height='7.5' rx='1.6' fill='currentColor' />
  </svg>
)

/** 一行文章：标题（加密文章带锁）+ 分类 + 月日 + 封面（没有封面时用印章）。
 *  updated 为 true 时日期换成「更新于 年.月.日」 */
export const EssayRow = ({ post, updated }) => (
  <li className='essay-row'>
    <PageLink href={post.href}>
      <h3>
        {post.password && <LockIcon />}
        {post.title}
      </h3>
      <span className='row-meta'>
        {post.category && <span className='row-cat'>{post.category}</span>}
        {updated ? (
          <time className='row-updated' dateTime={updatedDay(post)}>
            更新于 {updatedDay(post).replaceAll('-', '.')}
          </time>
        ) : (
          <time dateTime={postDay(post)}>{String(postDay(post)).slice(5).replace('-', '.')}</time>
        )}
        {hasCover(post) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className='row-cover' src={post.pageCoverThumbnail} alt='' loading='lazy' />
        ) : (
          // 没有封面：用分类前两个字盖一枚小印，列表右侧不空着
          <span className='row-cover row-seal'>
            <Seal text={post.category || siteConfig('READING_SEAL', null, CONFIG) || siteConfig('AUTHOR')} />
          </span>
        )}
      </span>
    </PageLink>
  </li>
)

/** 分类筛选：「全部」+ 文章里出现过的分类 */
export const CategoryChips = ({ posts, value, onChange }) => {
  const counts = {}
  for (const p of posts || []) if (p.category) counts[p.category] = (counts[p.category] || 0) + 1
  const cats = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (cats.length < 2) return null
  return (
    <div className='filter-chips reveal' role='group' aria-label='按分类筛选'>
      <button type='button' className={!value ? 'active' : ''} aria-pressed={!value} onClick={() => onChange('')}>
        全部
      </button>
      {cats.map(([c, n]) => (
        <button key={c} type='button' className={value === c ? 'active' : ''} aria-pressed={value === c} onClick={() => onChange(c)}>
          {c}
          <span>{n}</span>
        </button>
      ))}
    </div>
  )
}

/** 按分类过滤，空字符串表示全部 */
export const filterByCategory = (posts, cat) => (cat ? (posts || []).filter(p => p.category === cat) : posts || [])

/** 滚动淡入：.reveal 进入视口时加 .in；新渲染出来的 .reveal（如切换分类）也会被接管。
 *  返回 true 后根节点才加 reveal-ready，没有 JS 时内容照常显示。 */
export const useReveal = () => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return
    const show = el => el.classList.add('in')
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            show(e.target)
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -8% 0px' }
    )
    // 主题加载后 NotionNext 会替换根节点，所以每次都从 document 重新找。
    // 顶边已进视口的直接显示：它们在 reveal-ready 加上之前就有 .in，首屏不会先藏再淡入
    const watch = () =>
      document.querySelectorAll('#theme-reading .reveal:not(.in)').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) show(el)
        else io.observe(el)
      })
    watch()
    const mo = new MutationObserver(watch)
    mo.observe(document.body, { childList: true, subtree: true })
    setReady(true)
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
  return ready
}

/** 按年分组的文章列表 */
export const YearGroups = ({ posts }) => {
  const groups = groupByYear(posts)
  if (groups.length === 0) return <p className='empty'>还没有文章。</p>
  return (
    <div id='posts-wrapper'>
      {groups.map(g => (
        <section key={g.year} className='year-group reveal'>
          <h2 className='year-label'>{g.year}</h2>
          <ul>
            {g.list.map(p => (
              <EssayRow key={p.id} post={p} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
