import { mapImgUrl } from '@/lib/db/notion/mapImage'
import { siteConfig } from '@/lib/config'
import { Fragment } from 'react'
import CONFIG from '../config'
import { PageLink, Seal, hasCover, postDay } from './Frame'
import { LayoutNotes, LayoutWebsites } from './MorePages'

/**
 * 独立页面（Notion 里 type=Page 的 about / projects / links / books / gallery）。
 * 内容都在 Notion 里按简单约定书写，手机上就能改：
 * - 二级标题分节；三级标题是一张卡片（项目、友链）
 * - 「链接：」「状态：」「技术：」这类以冒号开头的行是卡片字段
 * - 书单里一条列表项是一本书：「书名 / 作者 —— 短评」
 */

/** 页面顶层的 Notion 块，按 Notion 里的顺序 */
export const topBlocks = post => {
  const blocks = post?.blockMap?.block || {}
  const get = id => blocks[id]?.value?.value || blocks[id]?.value
  return (get(post?.id)?.content || [])
    .map(id => get(id))
    .filter(b => b?.alive !== false && b?.type)
    .map(b => ({ ...b, children: (b.content || []).map(get).filter(Boolean) }))
}

export const plain = b => (b?.properties?.title || []).map(s => s[0]).join('').trim()

/** Notion 富文本片段：链接、粗体、斜体、行内代码、删除线 */
export const RichText = ({ segs = [] }) =>
  segs.map(([text, marks = []], i) => {
    if (text === '‣') return null
    let node = text
    for (const [m, v] of marks) {
      if (m === 'b') node = <strong>{node}</strong>
      else if (m === 'i') node = <em>{node}</em>
      else if (m === 'c') node = <code>{node}</code>
      else if (m === 's') node = <s>{node}</s>
      else if (m === 'a') node = <PageLink href={v}>{node}</PageLink>
    }
    return <Fragment key={i}>{node}</Fragment>
  })

const Rich = ({ block }) => <RichText segs={block?.properties?.title} />

/** 极简块渲染：段落、标题、列表、引用、提示、分割线、图片 */
export const Blocks = ({ blocks }) => {
  const out = []
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const t = b.type
    if (t === 'bulleted_list' || t === 'numbered_list') {
      const items = []
      while (i < blocks.length && blocks[i].type === t) items.push(blocks[i++])
      i--
      const List = t === 'bulleted_list' ? 'ul' : 'ol'
      out.push(
        <List key={b.id}>
          {items.map(it => (
            <li key={it.id}>
              <Rich block={it} />
              {it.children.length > 0 && <Blocks blocks={it.children.map(c => ({ ...c, children: [] }))} />}
            </li>
          ))}
        </List>
      )
    } else if (t === 'header' || t === 'sub_header') out.push(<h2 key={b.id}><Rich block={b} /></h2>)
    else if (t === 'sub_sub_header') out.push(<h3 key={b.id}><Rich block={b} /></h3>)
    else if (t === 'quote' || t === 'callout') out.push(<blockquote key={b.id}><Rich block={b} /></blockquote>)
    else if (t === 'divider') out.push(<hr key={b.id} />)
    else if (t === 'image') {
      const src = b.format?.display_source || b.properties?.source?.[0]?.[0]
      // eslint-disable-next-line @next/next/no-img-element
      if (src) out.push(<img key={b.id} src={mapImgUrl(src, b)} alt={(b.properties?.caption || []).map(s => s[0]).join('')} loading='lazy' />)
    } else if (t === 'bookmark' && b.properties?.link) {
      const href = b.properties.link[0][0]
      const title = (b.properties.title || []).map(x => x[0]).join('') || host(href)
      out.push(
        <PageLink key={b.id} className='bookmark-card' href={href}>
          <strong>{title}</strong>
          <small>{host(href)}</small>
        </PageLink>
      )
    } else if (t === 'text' && plain(b)) out.push(<p key={b.id}><Rich block={b} /></p>)
  }
  return out
}

/** 按标题切分：返回 [{ heading, blocks }]，第一段 heading 为空（标题前的引言） */
export const splitBy = (blocks, types) => {
  const parts = [{ heading: null, blocks: [] }]
  for (const b of blocks) {
    if (types.includes(b.type)) parts.push({ heading: b, blocks: [] })
    else parts[parts.length - 1].blocks.push(b)
  }
  return parts
}

/** 「链接：xxx」这样的字段行 */
const FIELD = /^(链接|地址|网址|源码|代码|演示|状态|技术|作者|导演|更新于|更新|最近检查|检查于)\s*[:：]\s*(.*)$/
const fieldOf = b => {
  const m = plain(b).match(FIELD)
  if (!m) return null
  const href = (b.properties?.title || []).flatMap(s => s[1] || []).find(([k]) => k === 'a')?.[1]
  const value = m[2].trim()
  return { key: m[1], value, href: href || (/^https?:\/\//.test(value) ? value : null) }
}

/** 一张卡片：标题 + 一句话 + 字段 */
const toCard = ({ heading, blocks }) => {
  const fields = {}
  const links = []
  const rest = []
  for (const b of blocks) {
    const f = fieldOf(b)
    if (!f) rest.push(b)
    else if (f.href) links.push({ label: ['链接', '地址', '网址'].includes(f.key) ? '访问' : f.key, href: f.href })
    else fields[f.key] = f.value
  }
  const titleHref = (heading.properties?.title || []).flatMap(s => s[1] || []).find(([k]) => k === 'a')?.[1]
  if (titleHref && !links.length) links.push({ label: '访问', href: titleHref })
  return { id: heading.id, name: plain(heading), fields, links, desc: rest }
}

export const host = href => {
  try {
    return new URL(href).host.replace(/^www\./, '')
  } catch {
    return href
  }
}

/** 页头：小字 + 大标题 + 红句号 + 一句话 */
export const PageHead = ({ eyebrow, title, lede, side }) => (
  <header className='list-head page-head'>
    <div>
      {eyebrow && <p className='eyebrow'>{eyebrow}</p>}
      <h1>
        {title}
        <span className='title-period'>。</span>
      </h1>
      {lede}
    </div>
    {side}
  </header>
)

export const Wrap = ({ name, children }) => <div className={`page special-page page-${name}`}>{children}</div>

export const fmtDay = d => String(d || '').replaceAll('-', '.').replaceAll('/', '.')

/** 关于 + Now：标题含 Now 或「最近」的那一节做成卡片，「更新于：」一行是卡片日期 */
export const LayoutAbout = ({ post }) => {
  const parts = splitBy(topBlocks(post), ['header', 'sub_header'])
  const isNow = p => p.heading && /now|最近/i.test(plain(p.heading))
  return (
    <Wrap name='about'>
      <PageHead
        eyebrow='About'
        title={post.title}
        side={<Seal text={siteConfig('READING_SEAL', null, CONFIG) || siteConfig('AUTHOR')} />}
      />
      {parts.map((p, i) => {
        if (!p.heading) return p.blocks.length ? <div key='intro' className='page-prose about-intro reveal'><Blocks blocks={p.blocks} /></div> : null
        if (isNow(p)) {
          const date = p.blocks.map(fieldOf).find(f => f && f.key.startsWith('更新'))?.value || post.lastEditedDay
          return (
            <section key={p.heading.id} className='now-card reveal' aria-label='最近在做什么'>
              <div className='now-head'>
                <h2><Rich block={p.heading} /></h2>
                {date && <span>更新于 <time>{fmtDay(date)}</time></span>}
              </div>
              <div className='page-prose'><Blocks blocks={p.blocks.filter(b => !fieldOf(b)?.key.startsWith('更新'))} /></div>
            </section>
          )
        }
        return (
          <section key={p.heading.id || i} className='page-section reveal'>
            <h2 className='section-label'><Rich block={p.heading} /></h2>
            <div className='page-prose'><Blocks blocks={p.blocks} /></div>
          </section>
        )
      })}
    </Wrap>
  )
}

/** 状态：进行中 / 维护中 用朱红，其他（已归档、停更）用灰 */
const StatusTag = ({ value }) =>
  value ? <span className={`status-tag${/进行|维护|活跃|在做/.test(value) ? ' live' : ''}`}>{value}</span> : null

/** 项目：三级标题是项目名，下面一句话 + 「状态：」「技术：」「源码：」「演示：」 */
export const LayoutProjects = ({ post }) => {
  const [intro, ...cards] = splitBy(topBlocks(post), ['sub_sub_header', 'sub_header', 'header'])
  return (
    <Wrap name='projects'>
      <PageHead eyebrow='Projects' title={post.title} lede={intro.blocks.length > 0 && <div className='intro-text page-lede'><Blocks blocks={intro.blocks} /></div>} />
      <div className='card-grid'>
        {cards.map(toCard).map(c => (
          <article key={c.id} className='page-card project-card reveal'>
            <div className='card-top'>
              <h2>{c.name}</h2>
              <StatusTag value={c.fields['状态']} />
            </div>
            <div className='card-desc'><Blocks blocks={c.desc} /></div>
            {c.fields['技术'] && <p className='card-meta'>{c.fields['技术']}</p>}
            {c.links.length > 0 && (
              <p className='card-links'>
                {c.links.map(l => (
                  <PageLink key={l.href} href={l.href}>
                    {l.label}<span aria-hidden='true'>↗</span>
                  </PageLink>
                ))}
              </p>
            )}
          </article>
        ))}
      </div>
    </Wrap>
  )
}

/** 友链：三级标题是站名，下面一句介绍 + 「链接：」，整张卡片可点 */
export const LayoutLinks = ({ post }) => {
  const [intro, ...cards] = splitBy(topBlocks(post), ['sub_sub_header', 'sub_header', 'header'])
  return (
    <Wrap name='links'>
      <PageHead eyebrow='Links' title={post.title} lede={intro.blocks.length > 0 && <div className='intro-text page-lede'><Blocks blocks={intro.blocks} /></div>} />
      <ul className='card-grid link-grid'>
        {cards.map(toCard).map(c => {
          const href = c.links[0]?.href
          const body = (
            <>
              <span className='link-avatar' aria-hidden='true'>{c.name.replace(/^[\s（(【\[《「]+/, '').slice(0, 1)}</span>
              <span className='link-text'>
                <strong>{c.name}</strong>
                <span className='card-desc'>{c.desc.map(plain).join(' ')}</span>
                {href && <small>{host(href)}</small>}
              </span>
            </>
          )
          return (
            <li key={c.id} className='page-card link-card reveal'>
              {href ? <PageLink href={href}>{body}</PageLink> : <div>{body}</div>}
            </li>
          )
        })}
      </ul>
    </Wrap>
  )
}

/** 一条书影：「书名 / 作者 —— 短评」，短评可省 */
const splitItem = b => {
  const segs = b.properties?.title || []
  const text = segs.map(s => s[0]).join('')
  const m = text.match(/^(.*?)\s*(?:——|—|--|｜)\s*(.+)$/)
  const head = (m ? m[1] : text).trim()
  const [name, ...by] = head.split(/\s*[/／]\s*/)
  const href = segs.flatMap(s => s[1] || []).find(([k]) => k === 'a')?.[1]
  return { name: name.replace(/^《|》$/g, ''), by: by.join(' / '), note: m?.[2]?.trim(), href }
}

/** 书单与影单：二级标题是分组（在读、读完、在看、看过），列表项是一本书或一部片 */
export const LayoutBooks = ({ post }) => {
  const [intro, ...shelves] = splitBy(topBlocks(post), ['header', 'sub_header', 'sub_sub_header'])
  return (
    <Wrap name='books'>
      <PageHead eyebrow='Books & Films' title={post.title} lede={intro.blocks.length > 0 && <div className='intro-text page-lede'><Blocks blocks={intro.blocks} /></div>} />
      {shelves.map(s => {
        const items = s.blocks.filter(b => ['bulleted_list', 'numbered_list', 'to_do'].includes(b.type) && plain(b)).map(splitItem)
        const notes = s.blocks.filter(b => b.type === 'text')
        return (
          <section key={s.heading.id} className='shelf reveal'>
            <h2 className='section-label'>
              <Rich block={s.heading} />
              <span>{items.length}</span>
            </h2>
            <div>
              {notes.length > 0 && <div className='page-prose shelf-note'><Blocks blocks={notes} /></div>}
              {items.length === 0 ? (
                <p className='empty-line'>暂时空着。</p>
              ) : (
                <ul className='shelf-list'>
                  {items.map((it, i) => (
                    <li key={i}>
                      <p className='shelf-title'>
                        {it.href ? <PageLink href={it.href}>《{it.name}》</PageLink> : `《${it.name}》`}
                        {it.by && <small>{it.by}</small>}
                      </p>
                      {it.note && <p className='shelf-review'>{it.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )
      })}
    </Wrap>
  )
}

/** 空相框：还没有摄影集时显示 */
const EmptyFrames = () => (
  <div className='gallery-empty reveal'>
    <svg viewBox='0 0 120 84' width='120' height='84' aria-hidden='true'>
      <rect x='26' y='8' width='70' height='56' rx='3' transform='rotate(6 61 36)' fill='none' stroke='currentColor' strokeWidth='1.2' opacity='.45' />
      <rect x='18' y='14' width='72' height='58' rx='3' fill='var(--paper)' stroke='currentColor' strokeWidth='1.4' />
      <path d='M26 62l16-18 10 10 12-14 18 22z' fill='currentColor' opacity='.18' />
      <circle cx='70' cy='30' r='5' fill='var(--accent)' opacity='.75' />
    </svg>
    <p>相册还空着。</p>
    <small>第一组照片还在路上，先去读读<PageLink href='/'>文章</PageLink>吧。</small>
  </div>
)

/** 相册入口：汇总带「摄影集」标签的文章，Notion 页面正文作为引言 */
export const LayoutGallery = props => {
  const { post } = props
  const tag = siteConfig('READING_GALLERY_TAG', null, CONFIG)
  const albums = (props.allNavPages || [])
    .filter(p => (p.tags || []).includes(tag))
    .sort((a, b) => (b.publishDate || 0) - (a.publishDate || 0))
  const intro = topBlocks(post)
  return (
    <Wrap name='gallery'>
      <PageHead
        eyebrow='Photos'
        title={post.title}
        lede={intro.length > 0 && <div className='intro-text page-lede'><Blocks blocks={intro} /></div>}
      />
      {albums.length === 0 ? (
        <EmptyFrames />
      ) : (
        <ul className='album-grid'>
          {albums.map(a => (
            <li key={a.id} className='reveal'>
              <PageLink href={a.href} className='album-card'>
                <span className='photo-frame album-frame'>
                  {hasCover(a) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.pageCoverThumbnail} alt='' loading='lazy' />
                  ) : (
                    <span className='album-blank' aria-hidden='true' />
                  )}
                </span>
                <strong>{a.title}</strong>
                <time dateTime={postDay(a)}>{fmtDay(postDay(a))}</time>
              </PageLink>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  )
}

/** slug → 专门版式；没有对应的页面照常走文章版式 */
const PAGE_LAYOUTS = {
  about: LayoutAbout,
  projects: LayoutProjects,
  links: LayoutLinks,
  books: LayoutBooks,
  gallery: LayoutGallery,
  notes: LayoutNotes,
  websites: LayoutWebsites
}

export const pageLayoutFor = post =>
  post?.type === 'Page' && !post.password ? PAGE_LAYOUTS[String(post.slug || '').replace(/^\/+/, '')] : null
