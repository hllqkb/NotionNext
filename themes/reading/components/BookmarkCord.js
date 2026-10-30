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
      <span
        className={`cord-body${pulled ? ' is-pulled' : ''}`}
        onAnimationEnd={() => setPulled(false)}
        aria-hidden='true'>
        {/* 只有上段细线随视口伸长，下端装饰保留固定尺寸 */}
        <span className='cord-thread' />
        <svg
          viewBox='0 212 24 58'
          width='24'
          height='58'
          aria-hidden='true'
          focusable='false'>
          <path className='cord-line' d='M12 220V225M12 241V245' />
          <path className='cord-knot' d='M12 212l4 4-4 4-4-4z' />
          <circle className='cord-bi' cx='12' cy='233' r='8' />
          <circle className='cord-bi' cx='12' cy='233' r='2.6' />
          <path className='cord-cap' d='M10 245h4l.8 3.2h-5.6z' />
          <path
            className='cord-tassel'
            d='M10.2 248.2L8.4 266M11.1 248.2L10.4 266.8M12 248.2V267M12.9 248.2L13.6 266.8M13.8 248.2L15.6 266'
          />
        </svg>
      </span>
      <style jsx global>{`
        #theme-reading .bookmark-cord {
          position: fixed; top: 0; right: 8px; z-index: 40;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          width: 28px; height: max(320px, 60vh); padding: 0 0 6px; box-sizing: border-box;
          background: none; border: 0; color: var(--accent); cursor: pointer;
          transform: translateY(-100%); visibility: hidden;
          transition: transform 520ms var(--ease), visibility 0s linear 520ms;
          -webkit-tap-highlight-color: transparent;
        }
        #theme-reading .bookmark-cord.is-shown { transform: none; visibility: visible; transition: transform 520ms var(--ease), visibility 0s; }
        #theme-reading .bookmark-cord .cord-body {
          display: flex; flex-direction: column; align-items: center; flex: 1; min-height: 0;
          width: 24px; transition: transform 200ms var(--ease);
        }
        #theme-reading .bookmark-cord .cord-thread { flex: 1; width: 1.2px; background: currentColor; }
        #theme-reading .bookmark-cord svg { display: block; flex: none; width: 24px; height: 58px; overflow: visible; }
        #theme-reading .bookmark-cord .cord-line,
        #theme-reading .bookmark-cord .cord-tassel { fill: none; stroke: currentColor; stroke-linecap: round; }
        #theme-reading .bookmark-cord .cord-line { stroke-width: 1.2; }
        #theme-reading .bookmark-cord .cord-thread,
        #theme-reading .bookmark-cord .cord-line { opacity: .7; transition: opacity 200ms; }
        #theme-reading .bookmark-cord .cord-tassel { stroke-width: .8; opacity: .85; }
        #theme-reading .bookmark-cord .cord-knot,
        #theme-reading .bookmark-cord .cord-bi { fill: var(--paper); stroke: currentColor; stroke-width: 1.2; }
        #theme-reading .bookmark-cord .cord-cap { fill: currentColor; }
        #theme-reading .bookmark-cord:hover .cord-body { transform: translateY(2px); }
        #theme-reading .bookmark-cord:hover .cord-thread,
        #theme-reading .bookmark-cord:hover .cord-line { opacity: 1; }
        #theme-reading .bookmark-cord:focus-visible { outline: none; }
        #theme-reading .bookmark-cord:focus-visible .cord-bi:first-of-type { stroke-width: 2; }
        #theme-reading .bookmark-cord:focus-visible .cord-body { outline: 1px dashed currentColor; outline-offset: 3px; }
        #theme-reading .bookmark-cord .cord-body.is-pulled { animation: cord-pull 280ms var(--ease); }
        @keyframes cord-pull {
          35% { transform: translateY(8px); }
          100% { transform: none; }
        }
        /* 只占右侧页边，不压正文：文章页边宽 >1050px 40、≤1050px 30、≤800px 24、≤520px 20 */
        @media (max-width: 1050px) {
          #theme-reading .bookmark-cord { right: 2px; width: 24px; }
        }
        @media (max-width: 800px) {
          #theme-reading .bookmark-cord { width: 20px; height: max(220px, 45vh); }
          /* 保留手机上原有的装饰尺寸，不随绳长缩放 */
          #theme-reading .bookmark-cord .cord-body { width: 20px; }
          #theme-reading .bookmark-cord svg { width: 20px; height: 48.333333px; }
        }
        @media (max-width: 520px) {
          #theme-reading .bookmark-cord { right: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          #theme-reading .bookmark-cord { transform: none; opacity: 0; transition: opacity 200ms, visibility 0s linear 200ms; }
          #theme-reading .bookmark-cord.is-shown { opacity: 1; transition: opacity 200ms, visibility 0s; }
          #theme-reading .bookmark-cord .cord-body,
          #theme-reading .bookmark-cord:hover .cord-body { transition: none; transform: none; }
          #theme-reading .bookmark-cord .cord-body.is-pulled { animation: none; }
        }
        @media print {
          #theme-reading .bookmark-cord { display: none; }
        }
      `}</style>
    </button>
  )
}

export default BookmarkCord
