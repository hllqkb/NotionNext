import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
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

/** 一行文章：标题 + 月日 */
export const EssayRow = ({ post }) => (
  <li className='essay-row'>
    <SmartLink href={post.href}>
      <h3>{post.title}</h3>
      <time dateTime={postDay(post)}>{String(postDay(post)).slice(5).replace('-', '.')}</time>
    </SmartLink>
  </li>
)

/** 按年分组的文章列表 */
export const YearGroups = ({ posts }) => {
  const groups = groupByYear(posts)
  if (groups.length === 0) return <p className='empty'>还没有文章。</p>
  return (
    <div id='posts-wrapper'>
      {groups.map(g => (
        <section key={g.year} className='year-group'>
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
