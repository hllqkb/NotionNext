import { scrollBehavior } from '@/lib/readingPreferences'
import { uuidToId } from 'notion-utils'
import { useEffect, useRef, useState } from 'react'

const tocItems = toc => (toc || []).filter(t => t.indentLevel < 3)

/**
 * 当前章节：最后一个越过视口顶部 120px 的标题。滚动按帧合并，id 不变时 React 不会重渲染
 */
export const useActiveHeading = toc => {
  const [active, setActive] = useState('')
  useEffect(() => {
    const ids = tocItems(toc).map(t => uuidToId(t.id))
    if (ids.length === 0) return
    let frame = 0
    const update = () => {
      frame = 0
      let current = ''
      for (const id of ids) {
        const el = document.querySelector(`[data-id="${id}"]`)
        if (!el) continue
        if (el.getBoundingClientRect().top > 120) break
        current = id
      }
      setActive(current)
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
  }, [toc])
  return active
}

/**
 * 文章目录：点击平滑滚动到对应标题（Notion 标题块带 data-id），地址栏换成章节锚点
 * mobile：手机端版本，默认收起，点了章节就收起来
 */
const Toc = ({ toc, active, mobile = false }) => {
  const nav = useRef(null)
  const items = tocItems(toc)

  // 侧栏目录自己能滚：当前章节滚出侧栏可视区时只滚侧栏，不动页面
  useEffect(() => {
    const box = nav.current
    const link = active && box?.querySelector(`[href="#${active}"]`)
    if (!link || mobile) return
    if (link.offsetTop < box.scrollTop || link.offsetTop + link.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = link.offsetTop - box.clientHeight / 3
    }
  }, [active, mobile])

  if (items.length === 0) return null
  const go = (e, id) => {
    e.preventDefault()
    // 先收起手机目录再量位置，不然收起后内容上移，会滚过头
    if (mobile) e.currentTarget.closest('details')?.removeAttribute('open')
    const target = document.querySelector(`[data-id="${id}"]`)
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 24
      window.scrollTo({ top, behavior: scrollBehavior() })
      history.pushState(null, '', `#${id}`)
    }
  }
  return (
    <details className={`chapter-menu${mobile ? ' toc-mobile' : ''}`} open={!mobile}>
      <summary>
        本篇目录{mobile && <span className='toc-count'>{items.length} 节</span>}
      </summary>
      <nav ref={nav} className='toc' aria-label='文章章节'>
        {items.map(t => {
          const id = uuidToId(t.id)
          return (
            <a
              key={id}
              href={`#${id}`}
              className={`level-${t.indentLevel}${active === id ? ' active' : ''}`}
              aria-current={active === id ? 'location' : undefined}
              onClick={e => go(e, id)}>
              {t.text}
            </a>
          )
        })}
      </nav>
    </details>
  )
}

export default Toc
