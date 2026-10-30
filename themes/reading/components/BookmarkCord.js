import { useEffect, useState } from 'react'

/**
 * 回到页首：右上角垂下的一根书签绳，绳端系一枚玉璧和流苏
 * 往下读过一屏才显现；只拉末端，挂点不动，回顶立即开始
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

  useEffect(() => {
    if (!pulled) return
    // 回顶途中即使越过显示阈值，也让这一次轻拉完整归位
    const timer = window.setTimeout(() => setPulled(false), 280)
    return () => window.clearTimeout(timer)
  }, [pulled])

  const backToTop = e => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setPulled(!reduce && window.innerWidth > 800)
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    // 键盘触发时绳子收起后焦点会丢，交给页头第一个链接（不再额外滚动）
    if (e.detail === 0) document.querySelector('#theme-reading .masthead a')?.focus({ preventScroll: true })
  }

  return (
    <div className={`bookmark-cord${shown || pulled ? ' is-shown' : ''}${pulled ? ' is-pulled' : ''}`}>
      {/* 长绳只作装饰，不接管点击或滚动；末端单独成为按钮 */}
      <span className='cord-thread' aria-hidden='true' />
      <span className='cord-end'>
        <button
          type='button'
          className='cord-handle'
          aria-label='回到页首'
          onClick={backToTop}>
          <span className='cord-hint' aria-hidden='true'>回到页首</span>
          <svg
            className='cord-ornament'
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
          <span className='cord-mobile' aria-hidden='true'>
            <svg viewBox='0 0 12 16' width='12' height='16' focusable='false'>
              <path d='M6 14V2M2 6l4-4 4 4' />
            </svg>
            <span>页首</span>
          </span>
        </button>
      </span>
      <style jsx global>{`
        #theme-reading .bookmark-cord {
          position: fixed; top: 0; right: 0; z-index: 40;
          /* 文章页最窄页边为 40px；版心外有余地时才扩到 44px */
          width: clamp(40px, calc((100vw - 1180px) / 2 + 40px), 44px);
          height: max(320px, 60vh); color: var(--accent); pointer-events: none;
          opacity: 0; visibility: hidden;
          transition: opacity 160ms, visibility 0s linear 160ms;
        }
        #theme-reading .bookmark-cord.is-shown { opacity: 1; visibility: visible; transition: opacity 160ms, visibility 0s; }
        #theme-reading .bookmark-cord .cord-thread {
          position: absolute; top: 0; bottom: 64px; left: calc(50% - .6px);
          width: 1.2px; background: currentColor; opacity: .7; pointer-events: none;
        }
        /* 固定线段的起点，用末端的 8px 补线与装饰同步伸缩 */
        #theme-reading .bookmark-cord .cord-thread::after {
          content: ''; position: absolute; top: 100%; left: 0; width: 100%; height: 8px;
          background: currentColor; transform: scaleY(0); transform-origin: top;
          transition: transform 140ms var(--ease);
        }
        #theme-reading .bookmark-cord .cord-end {
          position: absolute; top: calc(100% - 64px); left: 0; width: 100%; height: 58px;
          transform: translateY(var(--cord-rest, 0px)); transition: transform 140ms var(--ease);
        }
        #theme-reading .bookmark-cord .cord-handle {
          position: absolute; top: 5px; left: 0; width: 100%; height: 48px;
          padding: 0; box-sizing: border-box; background: none; border: 0; border-radius: 0;
          color: inherit; font: 400 13px/1.4 var(--font); cursor: pointer;
          pointer-events: auto; -webkit-tap-highlight-color: transparent;
        }
        #theme-reading .bookmark-cord .cord-ornament {
          position: absolute; top: -5px; left: calc(50% - 12px);
          display: block; width: 24px; height: 58px; overflow: visible; pointer-events: none;
        }
        #theme-reading .bookmark-cord .cord-hint {
          position: absolute; right: calc(100% + 6px); top: 50%; transform: translateY(-50%);
          color: var(--muted); background: var(--paper); white-space: nowrap;
          opacity: 0; pointer-events: none; transition: opacity 160ms;
        }
        #theme-reading .bookmark-cord .cord-line,
        #theme-reading .bookmark-cord .cord-tassel { fill: none; stroke: currentColor; stroke-linecap: round; }
        #theme-reading .bookmark-cord .cord-line { stroke-width: 1.2; opacity: .7; }
        #theme-reading .bookmark-cord .cord-tassel { stroke-width: .8; opacity: .85; }
        #theme-reading .bookmark-cord .cord-knot,
        #theme-reading .bookmark-cord .cord-bi { fill: var(--paper); stroke: currentColor; stroke-width: 1.2; }
        #theme-reading .bookmark-cord .cord-cap { fill: currentColor; }
        #theme-reading .bookmark-cord .cord-handle:focus-visible { outline: 1px dashed currentColor; outline-offset: -2px; }
        #theme-reading .bookmark-cord .cord-handle:focus-visible .cord-hint { opacity: 1; }
        #theme-reading .bookmark-cord .cord-mobile { display: none; }
        @media (hover: hover) and (pointer: fine) {
          #theme-reading .bookmark-cord:has(.cord-handle:hover) { --cord-rest: 2px; --cord-extension: .25; }
          #theme-reading .bookmark-cord:has(.cord-handle:hover) .cord-thread::after { transform: scaleY(.25); }
          #theme-reading .bookmark-cord .cord-handle:hover .cord-hint { opacity: 1; }
        }
        #theme-reading .bookmark-cord.is-pulled .cord-end { animation: reading-cord-pull 280ms var(--ease); }
        #theme-reading .bookmark-cord.is-pulled .cord-thread::after { animation: reading-cord-extend 280ms var(--ease); }
        @keyframes reading-cord-pull {
          0%, 100% { transform: translateY(var(--cord-rest, 0px)); }
          35% { transform: translateY(8px); }
        }
        @keyframes reading-cord-extend {
          0%, 100% { transform: scaleY(var(--cord-extension, 0)); }
          35% { transform: scaleY(1); }
        }
        @media (max-width: 1050px) {
          /* 此时文章右侧只有 30px，透明区域也不能越入正文 */
          #theme-reading .bookmark-cord { width: 30px; }
        }
        @media (max-width: 800px) {
          /* 390px 屏宽的正文左右各留 20px，放不下 44px：小控件留在页边 */
          #theme-reading .bookmark-cord {
            top: auto; right: 0; bottom: calc(16px + env(safe-area-inset-bottom, 0px));
            width: 20px; height: 64px; color: var(--muted);
          }
          #theme-reading .bookmark-cord .cord-thread,
          #theme-reading .bookmark-cord .cord-ornament,
          #theme-reading .bookmark-cord .cord-hint { display: none; }
          #theme-reading .bookmark-cord .cord-end,
          #theme-reading .bookmark-cord.is-pulled .cord-end { top: 0; height: 100%; transform: none; transition: none; animation: none; }
          #theme-reading .bookmark-cord .cord-handle { top: 0; height: 100%; }
          #theme-reading .bookmark-cord .cord-mobile { display: flex; flex-direction: column; align-items: center; gap: 5px; pointer-events: none; }
          #theme-reading .bookmark-cord .cord-mobile > span { writing-mode: vertical-rl; letter-spacing: .12em; }
          #theme-reading .bookmark-cord .cord-mobile svg { fill: none; stroke: currentColor; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
        }
        @media (prefers-reduced-motion: reduce) {
          #theme-reading .bookmark-cord,
          #theme-reading .bookmark-cord.is-shown { transition: none; }
          #theme-reading .bookmark-cord .cord-end,
          #theme-reading .bookmark-cord.is-pulled .cord-end,
          #theme-reading .bookmark-cord.is-pulled .cord-thread::after,
          #theme-reading .bookmark-cord .cord-thread::after { transform: none; transition: none; animation: none; }
          #theme-reading .bookmark-cord .cord-thread::after { display: none; }
          #theme-reading .bookmark-cord .cord-hint { transition: none; }
        }
        @media print {
          #theme-reading .bookmark-cord { display: none; }
        }
      `}</style>
    </div>
  )
}

export default BookmarkCord
