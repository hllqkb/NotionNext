import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import CONFIG from '../config'

/** 页头：站名 + 导航 + 深浅色切换 */
export const Masthead = ({ siteInfo }) => {
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useGlobal()
  const path = router.asPath || '/'
  const links = [
    { href: '/', label: '文章', match: p => p === '/' || p.startsWith('/page') },
    { href: '/archive', label: '归档', match: p => p.startsWith('/archive') },
    { href: '/category', label: '分类', match: p => p.startsWith('/category') },
    { href: '/tag', label: '标签', match: p => p.startsWith('/tag') }
  ]
  return (
    <header className='masthead'>
      <SmartLink className='brand' href='/'>
        {siteConfig('TITLE') || siteInfo?.title}
        <span className='brand-dot' aria-hidden='true' />
      </SmartLink>
      <nav aria-label='主导航'>
        {links.map(l => (
          <SmartLink key={l.href} href={l.href} className={l.match(path) ? 'active' : ''}>
            {l.label}
          </SmartLink>
        ))}
        <button type='button' onClick={toggleDarkMode} aria-label='切换深浅色'>
          {isDarkMode ? '浅色' : '深色'}
        </button>
      </nav>
    </header>
  )
}

/** 页脚 */
export const SiteFooter = ({ siteInfo }) => (
  <footer className='site-footer'>
    <span>
      {siteConfig('TITLE') || siteInfo?.title} · © {new Date().getFullYear()} {siteConfig('AUTHOR')}
    </span>
    <span>{siteConfig('READING_FOOTER_RIGHT', null, CONFIG)}</span>
  </footer>
)

/** 文章日期：优先发布日期 */
export const postDay = post => post?.publishDay || post?.date?.start_date || post?.createdTime || ''

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

/** 加密文章的小锁 */
export const LockIcon = () => (
  <svg className='lock' viewBox='0 0 16 16' width='14' height='14' aria-label='需要密码' role='img'>
    <path d='M4.5 7V5a3.5 3.5 0 0 1 7 0v2' fill='none' stroke='currentColor' strokeWidth='1.4' />
    <rect x='3' y='7' width='10' height='7.5' rx='1.6' fill='currentColor' />
  </svg>
)

/** 一行文章：标题（加密文章带锁）+ 分类 + 月日 */
export const EssayRow = ({ post }) => (
  <li className='essay-row'>
    <SmartLink href={post.href}>
      <h3>
        {post.password && <LockIcon />}
        {post.title}
      </h3>
      <span className='row-meta'>
        {post.category && <span className='row-cat'>{post.category}</span>}
        <time dateTime={postDay(post)}>{String(postDay(post)).slice(5).replace('-', '.')}</time>
      </span>
    </SmartLink>
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
    const root = document.getElementById('theme-reading')
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!root || reduce || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -8% 0px' }
    )
    const watch = () => root.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el))
    watch()
    const mo = new MutationObserver(watch)
    mo.observe(root, { childList: true, subtree: true })
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
