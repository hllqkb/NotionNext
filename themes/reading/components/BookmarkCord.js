import { useEffect, useState } from 'react'

/**
 * 回到页首：右上角垂下的一根书签绳，绳端系一枚玉璧和流苏
 * 往下读过一屏才放下来，点一下轻拉一下再回到页首；平时静止不动
 */
const BookmarkCord = () => {
  const [shown, setShown] = useState(false)
  const [pulled, setPulled] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setShown(window.scrollY > window.innerHeight * 0.8)
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
  }, [])

  const backToTop = e => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setPulled(true)
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    // 键盘触发时绳子收起后焦点会丢，交给页头第一个链接（不再额外滚动）
    if (e.detail === 0) document.querySelector('#theme-reading .masthead a')?.focus({ preventScroll: true })
  }

  return (
    <button
      type='button'
      className={`bookmark-cord${shown ? ' is-shown' : ''}`}
      aria-label='回到页首'
      title='回到页首'
      onClick={backToTop}>
      <svg
        className={pulled ? 'is-pulled' : undefined}
        onAnimationEnd={() => setPulled(false)}
        viewBox='0 0 24 270'
        preserveAspectRatio='xMidYMax slice'
        width='24'
        height='270'
        aria-hidden='true'
        focusable='false'>
        {/* 只加长上段细线，下端装饰整体下移 154，保持形状和大小 */}
        <path className='cord-line' d='M12 0V212M12 220V225M12 241V245' />
        <path className='cord-knot' d='M12 212l4 4-4 4-4-4z' />
        <circle className='cord-bi' cx='12' cy='233' r='8' />
        <circle className='cord-bi' cx='12' cy='233' r='2.6' />
        <path className='cord-cap' d='M10 245h4l.8 3.2h-5.6z' />
        <path
          className='cord-tassel'
          d='M10.2 248.2L8.4 266M11.1 248.2L10.4 266.8M12 248.2V267M12.9 248.2L13.6 266.8M13.8 248.2L15.6 266'
        />
      </svg>
      <style jsx global>{`
        #theme-reading .bookmark-cord {
          position: fixed; top: 0; right: 8px; z-index: 40;
          display: flex; justify-content: center; width: 28px; padding: 0 0 6px;
          background: none; border: 0; color: var(--accent); cursor: pointer;
          transform: translateY(-100%); visibility: hidden;
          transition: transform 520ms var(--ease), visibility 0s linear 520ms;
          -webkit-tap-highlight-color: transparent;
        }
        #theme-reading .bookmark-cord.is-shown { transform: none; visibility: visible; transition: transform 520ms var(--ease), visibility 0s; }
        #theme-reading .bookmark-cord svg { display: block; overflow: visible; transition: transform 200ms var(--ease); }
        #theme-reading .bookmark-cord .cord-line,
        #theme-reading .bookmark-cord .cord-tassel { fill: none; stroke: currentColor; stroke-linecap: round; }
        #theme-reading .bookmark-cord .cord-line { stroke-width: 1.2; opacity: .7; transition: opacity 200ms; }
        #theme-reading .bookmark-cord .cord-tassel { stroke-width: .8; opacity: .85; }
        #theme-reading .bookmark-cord .cord-knot,
        #theme-reading .bookmark-cord .cord-bi { fill: var(--paper); stroke: currentColor; stroke-width: 1.2; }
        #theme-reading .bookmark-cord .cord-cap { fill: currentColor; }
        #theme-reading .bookmark-cord:hover svg { transform: translateY(2px); }
        #theme-reading .bookmark-cord:hover .cord-line { opacity: 1; }
        #theme-reading .bookmark-cord:focus-visible { outline: none; }
        #theme-reading .bookmark-cord:focus-visible .cord-bi:first-of-type { stroke-width: 2; }
        #theme-reading .bookmark-cord:focus-visible svg { outline: 1px dashed currentColor; outline-offset: 3px; }
        #theme-reading .bookmark-cord svg.is-pulled { animation: cord-pull 280ms var(--ease); }
        @keyframes cord-pull {
          35% { transform: translateY(8px); }
          100% { transform: none; }
        }
        /* 只占右侧页边，不压正文：文章页边宽 >1050px 40、≤1050px 30、≤800px 24、≤520px 20 */
        @media (max-width: 1050px) {
          #theme-reading .bookmark-cord { right: 2px; width: 24px; }
        }
        @media (max-width: 800px) {
          #theme-reading .bookmark-cord { width: 20px; }
          /* 按宽度等比缩放、底部对齐：顶部多出的细线伸出视口，装饰不变形 */
          #theme-reading .bookmark-cord svg { width: 20px; height: 180px; }
        }
        @media (max-width: 520px) {
          #theme-reading .bookmark-cord { right: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          #theme-reading .bookmark-cord { transform: none; opacity: 0; transition: opacity 200ms, visibility 0s linear 200ms; }
          #theme-reading .bookmark-cord.is-shown { opacity: 1; transition: opacity 200ms, visibility 0s; }
          #theme-reading .bookmark-cord svg,
          #theme-reading .bookmark-cord:hover svg { transition: none; transform: none; }
          #theme-reading .bookmark-cord svg.is-pulled { animation: none; }
        }
        @media print {
          #theme-reading .bookmark-cord { display: none; }
        }
      `}</style>
    </button>
  )
}

export default BookmarkCord
