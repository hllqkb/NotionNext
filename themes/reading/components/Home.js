import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import { EssayRow, LockIcon, PageLink, hasCover, postDay, updatedAt } from './Frame'

/**
 * 摘要只保留完整的句子：Notion 里的摘要常被截在半句（自动摘要按字数截断），
 * 这里切到最后一个句末标点；一个完整句子都没有时原样加省略号
 */
export const wholeSentences = text => {
  const s = String(text || '').trim()
  if (!s || /[。！？!?…]['"”’」』）)]*$/.test(s)) return s
  let end = -1
  for (const m of s.matchAll(/[。！？!?][”’」』）)]*/g)) end = m.index + m[0].length
  return end >= 12 ? s.slice(0, end) : `${s}…`
}

/** 小封面：有封面才放，没有就只留文字 */
export const PostMark = ({ post }) =>
  hasCover(post) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className='post-mark' src={post.pageCoverThumbnail} alt='' loading='lazy' />
  ) : null

/**
 * 「从这里读起」：Notion 勾了 featured 的文章优先，一篇都没勾时用 READING_PICKS 里的 slug。
 * 最多 3 篇，跳过已经在「最近一篇」里展示的那篇
 */
export const ReadingPicks = ({ posts = [], exclude }) => {
  const featured = posts.filter(p => p.featured)
  const slugs = String(siteConfig('READING_PICKS', '', CONFIG) || '')
    .split(',')
    .map(s => s.trim().replace(/^\//, ''))
    .filter(Boolean)
  const picks = (featured.length
    ? featured
    : slugs.map(s => posts.find(p => p.slug === s)).filter(Boolean)
  )
    .filter(p => p.slug !== exclude?.slug)
    .slice(0, 3)
  if (picks.length < 2) return null
  return (
    <section className='reading-picks reveal' aria-labelledby='reading-picks-title'>
      <h2 id='reading-picks-title'>
        从这里读起<small>初次来访，可以先看这几篇</small>
      </h2>
      <ol>
        {picks.map(p => (
          <li key={p.slug}>
            <PageLink href={p.href}>
              <PostMark post={p} />
              <span className='pick-text'>
                <span className='pick-title'>
                  {p.password && <LockIcon />}
                  {p.title}
                </span>
                <span className='pick-meta'>
                  {p.category && <span>{p.category}</span>}
                  <time dateTime={postDay(p)}>{String(postDay(p)).slice(0, 7).replace('-', '.')}</time>
                </span>
              </span>
            </PageLink>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** 能被随机抽到的文章：站内、未加密、不是当前页 */
const randomPool = (posts, current) =>
  (posts || []).filter(p => p?.href && !p.password && !/^https?:\/\//.test(p.href) && p.href !== current)

/**
 * 随便读一篇：全站同一个入口（首页、归档、404），在客户端从全部文章里抽一篇整页跳转，不请求新接口。
 * 没有 JS 时退回到归档页
 */
export const RandomPost = ({ posts, className = '', children = '随便读一篇' }) => {
  if (randomPool(posts).length < 2) return null
  const go = e => {
    const pool = randomPool(posts, window.location.pathname)
    if (!pool.length) return
    e.preventDefault()
    window.location.href = pool[Math.floor(Math.random() * pool.length)].href
  }
  return (
    <a href='/archive' className={`random-post ${className}`} onClick={go}>
      {children}
      <span aria-hidden='true'>↝</span>
    </a>
  )
}

/**
 * 归档的「最近更新」视图：按 Notion 最后编辑时间倒序排成一列，日期显示更新日。
 * 编辑时间也会因为改标签、迁移而变，所以只叫「最近更新」，不叫「最近核验」
 */
export const RecentlyUpdated = ({ posts = [] }) => {
  const list = [...posts].sort((a, b) => updatedAt(b) - updatedAt(a) || (b.publishDate || 0) - (a.publishDate || 0))
  if (!list.length) return <p className='empty'>还没有文章。</p>
  return (
    <div id='posts-wrapper'>
      <section className='year-group updated-group reveal'>
        <h2 className='year-label'>最近更新</h2>
        <ul>
          {list.map(p => (
            <EssayRow key={p.slug} post={p} updated />
          ))}
        </ul>
      </section>
    </div>
  )
}
