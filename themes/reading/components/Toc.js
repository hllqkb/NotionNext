import { uuidToId } from 'notion-utils'

/** 文章目录：点击平滑滚动到对应标题（Notion 标题块带 data-id） */
const Toc = ({ toc }) => {
  const items = (toc || []).filter(t => t.indentLevel < 3)
  if (items.length === 0) return null
  const go = (e, id) => {
    e.preventDefault()
    const target = document.querySelector(`[data-id="${id}"]`)
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 24
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }
  return (
    <details className='chapter-menu' open>
      <summary>本篇目录</summary>
      <nav className='toc' aria-label='文章章节'>
        {items.map(t => {
          const id = uuidToId(t.id)
          return (
            <a key={id} href={`#${id}`} className={`level-${t.indentLevel}`} onClick={e => go(e, id)}>
              {t.text}
            </a>
          )
        })}
      </nav>
    </details>
  )
}

export default Toc
