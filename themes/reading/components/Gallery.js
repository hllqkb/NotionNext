import { mapImgUrl } from '@/lib/db/notion/mapImage'
import { useCallback, useEffect, useRef, useState } from 'react'

/** 从文章的 Notion 块里取出所有图片（含说明文字） */
export const galleryImages = post => {
  const blocks = post?.blockMap?.block || {}
  const order = blocks[post?.id]?.value?.content || Object.keys(blocks)
  const imgs = []
  for (const id of order) {
    const b = blocks[id]?.value?.value || blocks[id]?.value
    if (b?.type !== 'image') continue
    const src = b.format?.display_source || b.properties?.source?.[0]?.[0]
    if (!src) continue
    imgs.push({ id, src: mapImgUrl(src, b), caption: (b.properties?.caption || []).map(s => s[0]).join('') })
  }
  return imgs
}

// 与 style.js 里 lightbox-out 的时长一致
const CLOSE_MS = 140

/** 摄影集：相框网格 + 大图浏览（← → 切换，Esc 关闭，关闭后焦点回到点开的那张） */
const Gallery = ({ images }) => {
  const [index, setIndex] = useState(-1)
  const [closing, setClosing] = useState(false)
  const triggerRef = useRef(null)
  const closeBtnRef = useRef(null)
  const open = index >= 0
  const go = useCallback(step => setIndex(i => (i + step + images.length) % images.length), [images.length])

  const show = (i, e) => {
    triggerRef.current = e.currentTarget
    setClosing(false)
    setIndex(i)
  }
  // 先播 140ms 渐隐再卸载；减少动态时直接关
  const close = useCallback(() => setClosing(true), [])
  useEffect(() => {
    if (!closing) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => {
      setIndex(-1)
      setClosing(false)
      triggerRef.current?.focus({ preventScroll: true })
    }, reduce ? 0 : CLOSE_MS)
    return () => clearTimeout(t)
  }, [closing])

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus({ preventScroll: true })
    const onKey = e => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, go, close])

  if (!images.length) return null
  const current = images[index]
  return (
    <>
      <div className='photo-grid'>
        {images.map((img, i) => (
          <button key={img.id} type='button' className='photo-frame reveal' onClick={e => show(i, e)} aria-label={`查看第 ${i + 1} 张${img.caption ? `：${img.caption}` : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.caption || ''} loading='lazy' />
            {img.caption && <span>{img.caption}</span>}
          </button>
        ))}
      </div>
      {open && (
        <div className={`lightbox${closing ? ' closing' : ''}`} role='dialog' aria-modal='true' aria-label='图片浏览' onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.src} alt={current.caption || ''} onClick={e => e.stopPropagation()} />
          <p className='lightbox-bar' onClick={e => e.stopPropagation()}>
            <button type='button' onClick={() => go(-1)} aria-label='上一张'>←</button>
            <span>
              {index + 1} / {images.length}
              {current.caption ? ` · ${current.caption}` : ''}
            </span>
            <button type='button' onClick={() => go(1)} aria-label='下一张'>→</button>
            <button ref={closeBtnRef} type='button' onClick={close} aria-label='关闭'>✕</button>
          </p>
        </div>
      )}
    </>
  )
}

export default Gallery
