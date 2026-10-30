import { useEffect, useState } from 'react'
import { PageLink } from './Frame'
// Pages.js 也引用本文件（注册 slug），这里只在组件函数里用它的导出，不在模块顶层用
import { Blocks, PageHead, RichText, Wrap, host, plain, topBlocks } from './Pages'

/**
 * 短笔记 /notes 与网址收藏 /websites，内容都在 Notion 的一个普通 Page 里：
 * - 短笔记：一条笔记以分割线（手机上打 ---）或标题开头，下面随便写字、贴图、贴链接。
 *   标题或第一行写日期（2026-10-29、2026.10.29 21:30）就用它，不写就用这条第一个块的创建时间。
 *   页面最前面的引用 / 提示块是引言。按日期倒序，按年分组，一次显示 20 条。
 * - 网址收藏：二级标题是分组；一条列表项是一个网址「[名称](链接) —— 一句话」，也可以直接贴书签块。
 */

const DATE = /(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})日?(?:\s+(\d{1,2})[:：](\d{2}))?/
const pad = n => String(n).padStart(2, '0')

/** 北京时间的 { day: 'YYYY-MM-DD', time: 'HH:mm' } */
const fromTimestamp = t => {
  const d = new Date(t + 8 * 3600 * 1000)
  return { day: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16), ts: t }
}

const dateIn = text => {
  const m = String(text || '').match(DATE)
  if (!m) return null
  const day = `${m[1]}-${pad(m[2])}-${pad(m[3])}`
  const time = m[4] ? `${pad(m[4])}:${m[5]}` : ''
  return { day, time, ts: Date.parse(`${day}T${time || '00:00'}:00+08:00`), raw: m[0] }
}

/** 把页面块切成一条条笔记 */
const toNotes = blocks => {
  const intro = []
  let i = 0
  while (i < blocks.length && ['quote', 'callout'].includes(blocks[i].type)) intro.push(blocks[i++])
  const notes = []
  let cur = null
  const start = () => {
    cur = { id: null, title: null, date: null, blocks: [] }
    notes.push(cur)
  }
  for (; i < blocks.length; i++) {
    const b = blocks[i]
    if (b.type === 'divider') {
      start()
      cur.id = b.id
      continue
    }
    if (['header', 'sub_header', 'sub_sub_header'].includes(b.type)) {
      // 紧跟在分割线后面的标题算同一条
      if (!cur || cur.blocks.length || cur.title || cur.date) start()
      cur.id = cur.id || b.id
      const d = dateIn(plain(b))
      if (d) cur.date = d
      const rest = plain(b).replace(d?.raw || '', '').replace(/^[\s·|｜:：-]+/, '').trim()
      if (rest) cur.title = rest
      continue
    }
    if (!cur) start()
    cur.id = cur.id || b.id
    // 第一行只写了日期，当作这条的日期
    if (!cur.date && !cur.blocks.length && b.type === 'text') {
      const d = dateIn(plain(b))
      if (d && plain(b).replace(d.raw, '').trim() === '') {
        cur.date = d
        continue
      }
    }
    cur.blocks.push(b)
  }
  return {
    intro,
    notes: notes
      .filter(n => n.blocks.length || n.title)
      .map(n => {
        if (!n.date) {
          const t = Math.min(...n.blocks.map(b => b.created_time).filter(Boolean))
          n.date = Number.isFinite(t) ? fromTimestamp(t) : null
        }
        return n
      })
      .sort((a, b) => (b.date?.ts || 0) - (a.date?.ts || 0))
  }
}

const PER_PAGE = 20

/** 短笔记 */
export const LayoutNotes = ({ post }) => {
  const { intro, notes } = toNotes(topBlocks(post))
  // 静态 HTML 里全部输出（没有 JS 也能看全），挂载后只留前 20 条，点「更早的」再展开
  const [limit, setLimit] = useState(Infinity)
  useEffect(() => setLimit(PER_PAGE), [])
  const shown = notes.slice(0, limit)
  const years = []
  for (const n of shown) {
    const y = n.date?.day.slice(0, 4) || '更早'
    if (years[years.length - 1]?.year !== y) years.push({ year: y, list: [] })
    years[years.length - 1].list.push(n)
  }
  return (
    <Wrap name='notes'>
      <PageHead
        eyebrow='随笔'
        title={post.title}
        lede={
          <div className='intro-text page-lede'>
            {intro.length > 0 ? <Blocks blocks={intro.map(b => ({ ...b, type: 'text' }))} /> : null}
            <p className='notes-count'>共 {notes.length} 条</p>
          </div>
        }
      />
      {notes.length === 0 && <p className='empty'>还没有笔记。</p>}
      {years.map(g => (
        <section key={g.year} className='year-group notes-year reveal'>
          <h2 className='year-label'>{g.year}</h2>
          <ol className='note-list'>
            {g.list.map(n => (
              <li key={n.id} className='note' id={n.date ? `note-${n.date.day}` : undefined}>
                <p className='note-meta'>
                  {n.date && (
                    <time dateTime={n.date.time ? `${n.date.day}T${n.date.time}+08:00` : n.date.day}>
                      {n.date.day.slice(5).replace('-', '.')}
                      {n.date.time && <small>{n.date.time}</small>}
                    </time>
                  )}
                  {n.title && <span className='note-title'>{n.title}</span>}
                </p>
                <div className='page-prose note-body'>
                  <Blocks blocks={n.blocks} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
      {notes.length > shown.length && (
        <div className='pager notes-more'>
          <span />
          <button type='button' onClick={() => setLimit(l => l + PER_PAGE)}>
            更早的 {Math.min(PER_PAGE, notes.length - shown.length)} 条 ↓
          </button>
        </div>
      )}
    </Wrap>
  )
}

/** 一条网址：列表项「[名称](链接) —— 一句话」或书签块 */
const toSite = b => {
  if (b.type === 'bookmark') {
    const href = b.properties?.link?.[0]?.[0]
    return href && { id: b.id, href, name: plain(b) || host(href), desc: (b.properties?.description || []).map(s => s[0]).join('') }
  }
  const segs = b.properties?.title || []
  const href = segs.flatMap(s => s[1] || []).find(([k]) => k === 'a')?.[1] || plain(b).match(/https?:\/\/\S+/)?.[0]
  if (!href) return null
  const text = plain(b)
  const m = text.match(/^(.*?)\s*(?:——|—|--|｜|：|:)\s*(.+)$/)
  const name = (m ? m[1] : text).replace(href, '').trim() || host(href)
  return { id: b.id, href, name, desc: m?.[2]?.replace(href, '').trim() || '' }
}

/** 网址收藏：二级标题分组，组内卡片 */
export const LayoutWebsites = ({ post }) => {
  const [intro, ...groups] = topBlocks(post).reduce(
    (parts, b) => {
      if (['header', 'sub_header', 'sub_sub_header'].includes(b.type)) parts.push({ heading: b, blocks: [] })
      else parts[parts.length - 1].blocks.push(b)
      return parts
    },
    [{ heading: null, blocks: [] }]
  )
  const sitesOf = blocks => blocks.filter(b => ['bulleted_list', 'numbered_list', 'to_do', 'bookmark', 'text'].includes(b.type)).map(toSite).filter(Boolean)
  // 标题前直接写的网址归到「未分组」
  const looseSites = sitesOf(intro.blocks)
  const introText = intro.blocks.filter(b => !toSite(b))
  const all = [...(looseSites.length ? [{ heading: null, sites: looseSites }] : []), ...groups.map(g => ({ heading: g.heading, sites: sitesOf(g.blocks) }))]
  return (
    <Wrap name='websites'>
      <PageHead eyebrow='网址' title={post.title} lede={introText.length > 0 && <div className='intro-text page-lede'><Blocks blocks={introText} /></div>} />
      {all.map((g, gi) => (
        <section key={g.heading?.id || gi} className='site-group reveal'>
          <h2 className='section-label'>
            {g.heading ? <RichText segs={g.heading.properties?.title} /> : '未分组'}
            <span>{g.sites.length}</span>
          </h2>
          <ul className='site-grid'>
            {g.sites.map(s => (
              <li key={s.id} className='page-card site-card'>
                <PageLink href={s.href}>
                  <strong>{s.name}</strong>
                  {s.desc && <span className='card-desc'>{s.desc}</span>}
                  <small>{host(s.href)}</small>
                </PageLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Wrap>
  )
}
