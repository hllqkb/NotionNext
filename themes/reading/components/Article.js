import { useEffect, useRef } from 'react'
import { LockIcon, PageLink, postDay } from './Frame'

/**
 * 文章页的附件：阅读进度条、系列目录、相关文章
 * 数据都从 allNavPages 取（全部已发布文章的摘要），渲染期不读 window，SSR 和首帧一致
 */

const samePost = (a, b) => Boolean(a && b) && (a.slug === b.slug || (a.href && a.href === b.href))
const seriesName = p => (Array.isArray(p?.series) ? p.series[0] : p?.series) || ''
const dotDay = p => String(postDay(p)).replaceAll('-', '.')

/**
 * 导语：summary 不为空，且不是正文开头的截断（CSDN 迁移来的文章大多是这样，93 篇里 86 篇）才显示。
 * 加密文章拿不到正文，直接显示
 */
export const dekOf = post => {
  const squash = s => String(s || '').replace(/\s+/g, '')
  const summary = squash(post?.summary).replace(/[.。…]+$/, '')
  if (!summary) return ''
  let body = ''
  for (const x of Object.values(post?.blockMap?.block || {})) {
    const b = x?.value?.value || x?.value
    if (!b || b.type === 'page' || b.type === 'code') continue
    for (const seg of b.properties?.title || []) body += String(seg[0] || '')
  }
  return squash(body).includes(summary.slice(0, 30)) ? '' : post.summary
}

/** 顶部细进度条：按正文 #article-wrapper 的上下边界算，直接改 transform，不触发 React 渲染 */
// ready：正文（动态分包）挂载后变 true，重新测一次高度，免得先按空正文算成读完
export const ReadingProgress = ({ ready = true }) => {
  const bar = useRef(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const article = document.getElementById('article-wrapper')
      if (!bar.current) return
      if (!article) {
        bar.current.style.transform = 'scaleX(0)'
        return
      }
      const rect = article.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      // 短文一屏放得下：正文底部进了视口就算读完
      const ratio = total > 0 ? -rect.top / total : rect.bottom <= window.innerHeight ? 1 : 0
      bar.current.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ready])
  return (
    <div className='read-progress' aria-hidden='true'>
      <span ref={bar} />
    </div>
  )
}

/** 同系列文章，按 seriesOrder、再按发布时间排；少于 2 篇不算系列 */
export const getSeries = (post, pages = []) => {
  const self = pages.find(p => samePost(p, post)) || post
  const name = seriesName(self)
  if (!name) return null
  const posts = pages
    .filter(p => seriesName(p) === name)
    .sort((a, b) => (a.seriesOrder ?? Infinity) - (b.seriesOrder ?? Infinity) || (a.publishDate || 0) - (b.publishDate || 0))
  const index = posts.findIndex(p => samePost(p, post))
  if (posts.length < 2 || index < 0) return null
  return { name, posts, index }
}

/** 文首系列目录：一行「系列 · 第 n 篇」，篇数多时默认收起 */
export const SeriesBox = ({ series }) => {
  if (!series) return null
  const { name, posts, index } = series
  return (
    <nav className='series-box' aria-label={`系列：${name}`}>
      <details open={posts.length <= 6}>
        <summary>
          <span className='series-tag'>系列</span>
          <strong>{name}</strong>
          <span className='series-count'>
            第 {index + 1} 篇 · 共 {posts.length} 篇
          </span>
        </summary>
        <ol>
          {posts.map((p, i) => (
            <li key={p.slug} className={i === index ? 'current' : undefined}>
              {i === index ? (
                <span aria-current='page'>{p.title}</span>
              ) : (
                <PageLink href={p.href || `/${p.slug}`}>
                  {p.password && <LockIcon />}
                  {p.title}
                </PageLink>
              )}
            </li>
          ))}
        </ol>
      </details>
    </nav>
  )
}

/**
 * 相关文章打分：共同标签每个 2 分，同分类 1 分，0 分的不要。
 * 同分计发布时间离当前文章近的在前（同一阶段写的更可能有关，「技术分享」这种大分类也不至于随机）。
 * 排除自己、加密文章和同系列文章（系列目录里已经有了）
 */
export const getRelatedPosts = (post, pages = [], series, count = 4) => {
  const tags = new Set(post?.tags || [])
  const inSeries = new Set((series?.posts || []).map(p => p.slug))
  const at = post?.publishDate || 0
  return pages
    .filter(p => !samePost(p, post) && !p.password && !inSeries.has(p.slug))
    .map(p => {
      const shared = (p.tags || []).filter(t => tags.has(t)).length
      return { p, score: shared * 2 + (post.category && p.category === post.category ? 1 : 0) }
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || Math.abs((a.p.publishDate || 0) - at) - Math.abs((b.p.publishDate || 0) - at))
    .slice(0, count)
    .map(x => x.p)
}

/** 文末相关文章：日期 | 标题 | 分类 的紧凑列表 */
export const RelatedPosts = ({ posts }) => {
  if (!posts?.length) return null
  return (
    <section className='related reveal' aria-labelledby='related-title'>
      <h2 id='related-title'>相关文章</h2>
      <ul>
        {posts.map(p => (
          <li key={p.slug}>
            <PageLink href={p.href || `/${p.slug}`}>
              <time dateTime={postDay(p)}>{dotDay(p)}</time>
              <span className='related-title'>{p.title}</span>
              {p.category && <span className='related-cat'>{p.category}</span>}
            </PageLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
