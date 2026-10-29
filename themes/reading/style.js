/* eslint-disable react/no-unknown-property */
/**
 * reading 主题样式：纸色底、墨色字、赭红点缀，霞鹜文楷（字体由 FONT_URL 加载）
 * 只作用于 #theme-reading 内部
 */
const Style = () => {
  return (
    <style jsx global>{`
      #theme-reading {
        --paper: #f7f6f0;
        --sidebar: #f0eee7;
        --ink: #34352e;
        --muted: #78786e;
        --line: #dfdfd4;
        --line-soft: #e8e7df;
        --accent: #aa533b;
        --quote-bg: #f0ede5;
        --code-bg: #eeece5;
        --font: 'LXGW WenKai', 'Kaiti SC', KaiTi, serif;
        /* 动效统一用这条曲线，只动 transform / opacity */
        --ease: cubic-bezier(.22, 1, .36, 1);
        background: var(--paper);
        color: var(--ink);
        font: 400 18px/1.8 var(--font);
        min-height: 100vh;
      }
      .dark #theme-reading {
        --paper: #1c1b18;
        --sidebar: #24221e;
        --ink: #e6e2d8;
        --muted: #a29d91;
        --line: #3a3832;
        --line-soft: #2f2d28;
        --accent: #e0896e;
        --quote-bg: #26241f;
        --code-bg: #2a2823;
      }
      .dark body { background: #1c1b18; }
      body { background: #f7f6f0; }

      #theme-reading a { color: inherit; text-decoration: none; }
      #theme-reading a:hover { color: var(--accent); }
      #theme-reading ::selection { background: #e4cebc; }
      #theme-reading .page { max-width: 1080px; margin: auto; padding: 0 56px; }

      /* 页头 */
      #theme-reading .masthead { display: flex; justify-content: space-between; align-items: center; padding: 26px 0; border-bottom: 1px solid var(--line); gap: 24px; }
      #theme-reading .brand { display: flex; align-items: center; gap: 10px; font-size: 23px; white-space: nowrap; }
      #theme-reading .brand-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); margin-top: 3px; }
      #theme-reading .masthead nav { display: flex; gap: 28px; font-size: 16px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
      #theme-reading .masthead nav .active { color: var(--accent); }
      #theme-reading .masthead button { background: none; border: 0; color: inherit; font: inherit; cursor: pointer; padding: 0; }

      /* 首页大标题 */
      #theme-reading .intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; padding: 46px 0 36px; }
      #theme-reading .eyebrow { margin: 0 0 14px; color: var(--muted); font-size: 14px; letter-spacing: .12em; }
      #theme-reading .intro h1 { font-size: 76px; font-weight: 400; line-height: 1.2; margin: 0 0 18px; letter-spacing: -.05em; }
      #theme-reading .title-period { color: var(--accent); font-size: .78em; }
      #theme-reading .intro-text { margin: 0; font-size: 20px; color: var(--muted); }
      #theme-reading .collection-note { font-size: 15px; line-height: 1.9; text-align: right; margin: 0 0 3px; color: var(--muted); }

      /* 计数 + 搜索 */
      #theme-reading .collection-bar { display: flex; align-items: flex-start; justify-content: space-between; gap: 32px; padding: 18px 0; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--line); font-size: 14px; color: var(--muted); }
      #theme-reading .collection-bar p { margin: 0; padding-top: 3px; }
      #theme-reading .search-box { max-width: 340px; flex: 1; }
      #theme-reading .search-box input { width: 100%; padding: 9px 14px; border: 1px solid var(--line); border-radius: 6px; background: transparent; font: 400 16px/1.5 var(--font); color: var(--ink); }

      /* 最近一篇 */
      #theme-reading .lead-story { padding: 28px 0 32px; border-bottom: 1px solid var(--line); }
      #theme-reading .lead-meta { display: flex; gap: 18px; align-items: center; font-size: 14px; color: var(--muted); margin-bottom: 14px; }
      #theme-reading .lead-meta > span { color: var(--accent); }
      #theme-reading .lead-story h2 { font-weight: 400; font-size: 30px; line-height: 1.5; margin: 0 0 8px; }
      #theme-reading .lead-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 36px; align-items: end; }
      #theme-reading .lead-story p { font-size: 17px; line-height: 1.9; color: var(--muted); margin: 0; }
      #theme-reading .read-link { font-size: 14px; white-space: nowrap; display: flex; align-items: center; gap: 20px; }
      #theme-reading .read-link > span { font-family: Georgia, serif; font-size: 23px; color: var(--accent); transition: transform 160ms var(--ease); }
      #theme-reading .read-link:hover > span,
      #theme-reading .read-link:focus-visible > span { transform: translate(2px, -2px); }
      #theme-reading .read-link:active > span { transform: translate(1px, -1px) scale(.94); transition-duration: 100ms; }

      /* 按年分组 */
      #theme-reading .year-group { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 24px; padding: 30px 0 22px; border-bottom: 1px solid var(--line); }
      #theme-reading .year-group:last-child { border-bottom: 0; }
      #theme-reading .year-label { font-weight: 400; font-size: 29px; line-height: 1.4; margin: 15px 0; color: var(--muted); font-variant-numeric: tabular-nums; }
      #theme-reading .year-group ul { list-style: none; margin: 0; padding: 0; }
      #theme-reading .essay-row a { display: flex; align-items: baseline; justify-content: space-between; gap: 32px; padding: 16px 0; transition: transform 160ms var(--ease); }
      #theme-reading .essay-row a:hover,
      #theme-reading .essay-row a:focus-visible { transform: translateX(2px); }
      #theme-reading .essay-row a:active { transform: translateX(2px) scale(.995); transition-duration: 100ms; }
      #theme-reading .essay-row h3 { font-size: 21px; font-weight: 400; line-height: 1.65; margin: 0; overflow-wrap: anywhere; }
      #theme-reading .essay-row time { font-size: 14px; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
      #theme-reading .essay-row + .essay-row { border-top: 1px solid var(--line-soft); }
      #theme-reading .empty { padding: 50px 0; color: var(--muted); }

      /* 年谱时间线：每年一条竖线，每篇一个圆点，当年最新一篇点亮 */
      #theme-reading .year-group ul { position: relative; padding-left: 26px; }
      #theme-reading .year-group ul::before { content: ''; position: absolute; left: 4px; top: 26px; bottom: 26px; width: 1px; background: var(--line); }
      #theme-reading .essay-row { position: relative; }
      #theme-reading .essay-row::before { content: ''; position: absolute; left: -26px; top: 31px; width: 9px; height: 9px; border-radius: 50%; background: var(--paper); border: 1px solid var(--muted); transition: transform 160ms var(--ease); }
      #theme-reading .essay-row:first-child::before { background: var(--accent); border-color: var(--accent); }
      #theme-reading .essay-row:hover::before,
      #theme-reading .essay-row:focus-within::before { border-color: var(--accent); transform: scale(1.12); }
      #theme-reading .essay-row:active::before { transform: scale(1); transition-duration: 100ms; }
      #theme-reading .row-meta { display: flex; align-items: baseline; gap: 14px; flex-shrink: 0; }
      #theme-reading .row-cat { font-size: 13px; color: var(--accent); }
      #theme-reading .lock { display: inline-block; vertical-align: -1px; margin-right: 8px; color: var(--muted); }

      /* 首页右侧：竖排一句话 + 朱红印章 */
      #theme-reading .intro-side { display: flex; align-items: flex-end; gap: 18px; align-self: stretch; }
      #theme-reading .vertical-title { margin: 0; display: flex; flex-direction: row-reverse; gap: 14px; font-size: 17px; color: var(--muted); }
      #theme-reading .vertical-title span { writing-mode: vertical-rl; letter-spacing: .3em; line-height: 1; white-space: nowrap; }
      #theme-reading .vertical-title span:first-child { color: var(--ink); }
      #theme-reading .seal { display: inline-flex; align-items: center; justify-content: center; width: 54px; height: 54px; border: 2px solid var(--accent); border-radius: 6px; color: var(--accent); font-size: 21px; line-height: 1; letter-spacing: .05em; writing-mode: vertical-rl; transform: rotate(-4deg); box-shadow: inset 0 0 0 3px var(--paper), inset 0 0 0 4px var(--accent); opacity: .9; }
      #theme-reading .seal-latin { writing-mode: horizontal-tb; width: auto; height: 34px; padding: 0 12px; font-size: 17px; letter-spacing: .08em; font-family: Georgia, 'Times New Roman', serif; font-style: italic; }

      /* 写作打卡点阵 */
      #theme-reading .streak { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 0 0 26px; flex-wrap: wrap; }
      #theme-reading .streak-label { font-size: 15px; color: var(--ink); display: flex; gap: 12px; align-items: baseline; }
      #theme-reading .streak-label small { font-size: 13px; color: var(--muted); }
      #theme-reading .dots { display: flex; gap: 6px; flex-wrap: wrap; }
      #theme-reading .dot { width: 11px; height: 11px; border-radius: 50%; border: 1px solid var(--line); background: transparent; }
      #theme-reading .dot.level-1 { background: color-mix(in srgb, var(--accent) 35%, transparent); border-color: transparent; }
      #theme-reading .dot.level-2 { background: color-mix(in srgb, var(--accent) 65%, transparent); border-color: transparent; }
      #theme-reading .dot.level-3 { background: var(--accent); border-color: transparent; }
      #theme-reading .dot.this-week { outline: 1px solid var(--ink); outline-offset: 2px; }

      /* 封面：列表小图 + 最近一篇大图 */
      #theme-reading .row-cover { width: 64px; height: 44px; object-fit: cover; border-radius: 4px; flex-shrink: 0; align-self: center; }
      #theme-reading .essay-row a { align-items: center; }
      #theme-reading .lead-cover { display: block; margin-bottom: 22px; border-radius: 10px; overflow: hidden; aspect-ratio: 21 / 8; }
      #theme-reading .lead-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s var(--ease); }
      #theme-reading .lead-cover:hover img,
      #theme-reading .lead-cover:focus-visible img { transform: scale(1.03); }

      /* 摄影集 */
      #theme-reading .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
      #theme-reading .photo-frame { padding: 10px 10px 14px; background: #fffdf8; border: 1px solid var(--line); border-radius: 4px; box-shadow: 0 6px 18px -12px rgba(0,0,0,.35); cursor: zoom-in; text-align: center; font: inherit; color: var(--muted); transition: transform 160ms var(--ease); }
      .dark #theme-reading .photo-frame { background: var(--sidebar); }
      #theme-reading .photo-frame:hover,
      #theme-reading .photo-frame:focus-visible { transform: translateY(-2px) rotate(-.4deg); }
      #theme-reading .photo-frame:active { transform: scale(.98); transition-duration: 100ms; }
      #theme-reading .photo-frame img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
      #theme-reading .photo-frame span { display: block; margin-top: 8px; font-size: 14px; }
      #theme-reading .lightbox { position: fixed; inset: 0; z-index: 60; background: rgba(20, 18, 15, .92); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; animation: lightbox-in 200ms var(--ease) both; }
      #theme-reading .lightbox.closing { animation: lightbox-out 140ms var(--ease) both; }
      #theme-reading .lightbox img { max-width: 100%; max-height: 82vh; object-fit: contain; border-radius: 4px; animation: lightbox-img-in 200ms var(--ease) both; }
      @keyframes lightbox-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes lightbox-out { from { opacity: 1; } to { opacity: 0; } }
      @keyframes lightbox-img-in { from { transform: scale(.98); } to { transform: none; } }
      #theme-reading .lightbox-bar { display: flex; align-items: center; gap: 18px; color: #e6e2d8; font-size: 15px; margin: 0; }
      #theme-reading .lightbox-bar button { background: none; border: 1px solid rgba(230, 226, 216, .4); color: inherit; border-radius: 999px; width: 36px; height: 36px; cursor: pointer; font-size: 16px; }

      /* 评论（Waline）：配色跟主题走 */
      #theme-reading .comments { margin-top: 48px; padding-top: 28px; border-top: 1px solid var(--line); }
      #theme-reading .comments [data-waline] {
        --waline-font-size: 16px; --waline-white: var(--paper); --waline-light-grey: var(--muted);
        --waline-dark-grey: var(--muted); --waline-theme-color: var(--accent); --waline-active-color: var(--accent);
        --waline-color: var(--ink); --waline-bg-color: var(--paper); --waline-bg-color-light: var(--sidebar);
        --waline-bg-color-hover: var(--sidebar); --waline-border-color: var(--line); --waline-disable-bg-color: var(--sidebar);
        --waline-info-bg-color: var(--sidebar); --waline-info-color: var(--muted); --waline-badge-color: var(--accent);
        font-family: var(--font);
      }

      /* 文末版权 + 上一篇下一篇 */
      #theme-reading .post-license { margin-top: 48px; padding: 18px 22px; background: var(--sidebar); border-radius: 10px; border-left: 3px solid var(--accent); font-size: 15px; color: var(--muted); }
      #theme-reading .post-license p { margin: 4px 0; overflow-wrap: anywhere; }
      #theme-reading .post-license span { display: inline-block; min-width: 3em; color: var(--ink); margin-right: 10px; }
      #theme-reading .post-license a { color: var(--accent); }
      #theme-reading .post-around { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 28px; }
      #theme-reading .post-around a { display: block; padding: 14px 18px; border: 1px solid var(--line); border-radius: 10px; font-size: 17px; line-height: 1.6; }
      #theme-reading .post-around a:hover { border-color: var(--accent); }
      #theme-reading .post-around a.next { text-align: right; }
      #theme-reading .post-around small { display: block; font-size: 13px; color: var(--muted); }

      /* 代码块：高亮配色用 prism-themes 的 One Light / One Dark（conf/code.config.js 按深浅色加载）。
         头部由 components/PrismMac.js 的 CODE_FRAME 生成：mac 圆点、语言名、复制、折叠在同一条里，
         Prism toolbar 自带的 .toolbar 隐藏；超过 CODE_COLLAPSE_MIN_LINES 行的代码收起时底部渐隐。 */
      #theme-reading {
        --code-block-bg: hsl(230, 1%, 98%);
        --code-block-head: hsl(230, 4%, 94%);
      }
      .dark #theme-reading {
        --code-block-bg: hsl(220, 13%, 18%);
        --code-block-head: hsl(220, 13%, 15%);
      }
      #theme-reading div.code-toolbar { display: flex; flex-direction: column; max-width: 100%; min-width: 0; margin: 1.2em 0; background: var(--code-block-bg); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; box-shadow: none; }
      #theme-reading div.code-toolbar.code-frame > .toolbar { display: none; }
      #theme-reading .code-frame-head { display: flex; align-items: center; gap: 12px; min-height: 38px; padding: 0 8px 0 14px; background: var(--code-block-head); border-bottom: 1px solid var(--line); transition: border-color .3s var(--ease); }
      #theme-reading .code-frame.is-hidden .code-frame-head { border-bottom-color: transparent; }
      #theme-reading .code-frame-dots { display: flex; gap: 6px; flex: none; }
      #theme-reading .code-frame-dots > span { width: 11px; height: 11px; border-radius: 50%; }
      #theme-reading .code-frame-dots > span:nth-child(1) { background: #ff5f57; }
      #theme-reading .code-frame-dots > span:nth-child(2) { background: #febc2e; }
      #theme-reading .code-frame-dots > span:nth-child(3) { background: #28c840; }
      #theme-reading .code-frame-lang { font: 13px/1 var(--font); color: var(--muted); white-space: nowrap; }
      #theme-reading .code-frame-actions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
      #theme-reading .code-frame button { font: 13px/1 var(--font); color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 6px; padding: 5px 10px; cursor: pointer; transition: color .2s, border-color .2s; }
      #theme-reading .code-frame button:hover,
      #theme-reading .code-frame button:focus-visible { color: var(--accent); border-color: var(--accent); }
      #theme-reading .code-frame-copy[data-state='copied'] { color: var(--accent); border-color: var(--accent); }
      #theme-reading .code-frame-toggle { display: inline-flex; align-items: center; padding: 4px 6px !important; }
      #theme-reading .code-frame-toggle svg { width: 15px; height: 15px; transition: transform .3s var(--ease); }
      #theme-reading .code-frame.is-hidden .code-frame-toggle svg { transform: rotate(-90deg); }
      #theme-reading div.code-toolbar > pre.notion-code { margin: 0 !important; padding: 14px 18px !important; border: 0 !important; border-radius: 0 !important; max-width: 100%; overflow-x: auto; font-size: 14px; line-height: 1.6; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
      #theme-reading div.code-frame > pre.notion-code { overflow-y: hidden; transition: max-height .35s var(--ease), padding .35s var(--ease); }
      #theme-reading div.code-frame.is-hidden > pre.notion-code { padding-top: 0 !important; padding-bottom: 0 !important; }
      /* Mermaid 图保留 notion.css 里给它的浅色衬底 */
      #theme-reading div.code-toolbar > pre.notion-code:not([class*='language-mermaid']) { background: transparent !important; }
      #theme-reading div.code-toolbar > pre.notion-code > code { white-space: pre; word-break: normal; overflow-wrap: normal; }
      #theme-reading .code-frame-more { position: relative; display: flex; justify-content: center; padding: 6px 0 10px; }
      #theme-reading .code-frame-more::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: 72px; background: linear-gradient(to bottom, transparent, var(--code-block-bg)); pointer-events: none; transition: opacity .3s var(--ease); }
      #theme-reading .code-frame:not(.is-folded) .code-frame-more::before { opacity: 0; }
      #theme-reading .code-frame.is-hidden .code-frame-more { display: none; }
      @media (prefers-reduced-motion: reduce) {
        #theme-reading div.code-frame > pre.notion-code,
        #theme-reading .code-frame-head,
        #theme-reading .code-frame-toggle svg,
        #theme-reading .code-frame-more::before { transition: none; }
      }
      #theme-reading .notion-code-copy { display: none; }

      /* 分类筛选 */
      #theme-reading .filter-chips { display: flex; flex-wrap: wrap; gap: 10px; padding: 18px 0 4px; }
      #theme-reading .filter-chips button { position: relative; border: 1px solid var(--line); border-radius: 999px; background: transparent; color: var(--ink); font: 400 15px/1.6 var(--font); padding: 3px 14px; cursor: pointer; }
      #theme-reading .filter-chips button:hover { border-color: var(--accent); color: var(--accent); }
      /* 选中态：赭红字 + 底部一道从中间展开的下划线 */
      #theme-reading .filter-chips button::after { content: ''; position: absolute; left: 14px; right: 14px; bottom: 3px; height: 1.5px; background: var(--accent); transform: scaleX(0); transition: transform 180ms var(--ease); }
      #theme-reading .filter-chips button.active { border-color: var(--accent); color: var(--accent); }
      #theme-reading .filter-chips button.active::after { transform: scaleX(1); }
      #theme-reading .filter-chips button span { margin-left: 6px; font-size: 12px; opacity: .7; }

      /* 滚动淡入：只有 JS 就绪后才先隐藏，避免无 JS 时内容看不见；首屏的块在就绪前已加 .in，不走动画 */
      #theme-reading.reveal-ready .reveal { opacity: 0; transform: translateY(8px); transition: opacity 280ms var(--ease), transform 280ms var(--ease); }
      #theme-reading.reveal-ready .reveal.in { opacity: 1; transform: none; }
      /* 年分组：整组只渐显，组内每篇错峰 40ms 上移，最多延迟 120ms */
      #theme-reading.reveal-ready .year-group.reveal { transform: none; }
      #theme-reading.reveal-ready .year-group.reveal li { opacity: 0; transform: translateY(8px); transition: opacity 280ms var(--ease), transform 280ms var(--ease); }
      #theme-reading.reveal-ready .year-group.reveal.in li { opacity: 1; transform: none; }
      #theme-reading.reveal-ready .year-group.reveal li:nth-child(2) { transition-delay: 40ms; }
      #theme-reading.reveal-ready .year-group.reveal li:nth-child(3) { transition-delay: 80ms; }
      #theme-reading.reveal-ready .year-group.reveal li:nth-child(n + 4) { transition-delay: 120ms; }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto !important; }
        #theme-reading.reveal-ready .reveal,
        #theme-reading.reveal-ready .year-group.reveal li { opacity: 1; transform: none; transition: none; }
        #theme-reading .essay-row a,
        #theme-reading .essay-row::before,
        #theme-reading .read-link > span,
        #theme-reading .photo-frame,
        #theme-reading .lead-cover img,
        #theme-reading .lightbox img { transform: none !important; transition: none; animation: none; }
      }
      #theme-reading .pager { display: flex; justify-content: space-between; padding: 24px 0; font-size: 16px; }

      /* 分类 / 标签云 */
      #theme-reading .chips { display: flex; flex-wrap: wrap; gap: 12px; padding: 30px 0; }
      #theme-reading .chip { border: 1px solid var(--line); border-radius: 999px; padding: 4px 14px; font-size: 16px; }
      #theme-reading .chip span { color: var(--muted); font-size: 13px; margin-left: 6px; }
      #theme-reading .list-head { padding: 40px 0 10px; }
      #theme-reading .list-head h1 { font-size: 44px; font-weight: 400; margin: 0; }

      /* 文章页 */
      #theme-reading .reading-shell { display: grid; grid-template-columns: 216px minmax(0, 744px); gap: 76px; max-width: 1180px; margin: 60px auto 0; padding: 0 40px; align-items: start; }
      #theme-reading .sidebar { position: sticky; top: 30px; padding: 20px 18px; background: var(--sidebar); border-radius: 12px; color: var(--muted); font-size: 15px; }
      #theme-reading .all-articles { display: block; color: var(--ink); font-size: 17px; padding: 0 0 16px; }
      #theme-reading .chapter-menu { border-top: 1px solid var(--line); padding-top: 16px; }
      #theme-reading .chapter-menu summary { cursor: pointer; color: var(--ink); }
      #theme-reading .toc { display: flex; flex-direction: column; gap: 10px; padding: 18px 2px 4px; max-height: 55vh; overflow: auto; }
      #theme-reading .toc a { line-height: 1.65; overflow-wrap: anywhere; cursor: pointer; }
      #theme-reading .toc .level-1 { padding-left: 12px; font-size: 14px; }
      #theme-reading .toc .level-2 { padding-left: 24px; font-size: 13px; }
      #theme-reading .sidebar-note { border-top: 1px solid var(--line); margin-top: 22px; padding-top: 16px; font-size: 13px; }
      #theme-reading .sidebar-note p { font-size: 16px; color: var(--ink); margin: 0 0 10px; }
      #theme-reading .article-head { padding: 0 0 42px; margin-bottom: 38px; border-bottom: 1px solid var(--line); }
      #theme-reading .kicker { display: flex; align-items: baseline; flex-wrap: wrap; gap: 12px; color: var(--accent); font-size: 15px; margin: 0 0 20px; }
      #theme-reading .article-head h1 { font-size: 46px; font-weight: 400; line-height: 1.4; letter-spacing: -.02em; margin: 0 0 26px; overflow-wrap: anywhere; }
      #theme-reading .post-lock { max-width: 420px; }
      #theme-reading .post-lock label { display: block; margin: 0 0 14px; }
      #theme-reading .post-lock div { display: flex; gap: 10px; }
      #theme-reading .post-lock input { flex: 1; min-width: 0; font: inherit; color: var(--ink); background: transparent; border: 1px solid var(--line); border-radius: 4px; padding: 8px 12px; }
      #theme-reading .post-lock input:focus { outline: none; border-color: var(--accent); }
      #theme-reading .post-lock button { font: inherit; color: var(--paper); background: var(--accent); border: 0; border-radius: 4px; padding: 8px 18px; cursor: pointer; }
      #theme-reading .post-lock button:disabled { opacity: .5; cursor: default; }
      #theme-reading .post-lock [role='alert'] { color: var(--accent); margin: 12px 0 0; font-size: 15px; }
      #theme-reading .byline { display: flex; flex-wrap: wrap; gap: 10px; color: var(--muted); font-size: 15px; }
      #theme-reading .article-footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; gap: 24px; font-size: 16px; }
      #theme-reading .site-footer { max-width: 1080px; margin: 80px auto 0; padding: 24px 56px 32px; display: flex; justify-content: space-between; gap: 18px; font-size: 13px; color: var(--muted); border-top: 1px solid var(--line); }

      /* Notion 正文：沿用阅读版式 */
      #theme-reading .prose { font-size: 20px; line-height: 1.9; }
      #theme-reading .prose .notion,
      #theme-reading .prose .notion-page { font-family: var(--font); color: var(--ink); font-size: inherit; line-height: inherit; width: 100%; padding: 0; }
      #theme-reading .prose .notion-text { padding: 0; margin: 0 0 1.1em; }
      #theme-reading .prose .notion-h { font-weight: 400; line-height: 1.5; }
      #theme-reading .prose .notion-h1 { font-size: 32px; margin: 1.8em 0 .8em; padding-top: 20px; border-top: 1px solid var(--line); }
      #theme-reading .prose .notion-h2 { font-size: 28px; margin: 1.7em 0 .8em; }
      #theme-reading .prose .notion-h3 { font-size: 24px; margin: 1.5em 0 .7em; }
      #theme-reading .prose .notion-quote { border: 0; margin: 0 0 1.6em; padding: 20px 24px; background: var(--quote-bg); border-radius: 8px; color: var(--muted); font-size: inherit; }
      #theme-reading .prose b, #theme-reading .prose strong { font-weight: 600; color: var(--accent); }
      #theme-reading .prose .notion-link { color: var(--accent); border-bottom: 1px solid currentColor; opacity: 1; }
      #theme-reading .prose .notion-list { padding-left: 1.5em; margin: 0 0 1.2em; }
      #theme-reading .prose .notion-hr { border-top: 1px solid var(--line); margin: 36px 0; }
      #theme-reading .prose .notion-asset-wrapper img { border-radius: 8px; }
      #theme-reading .prose .notion-code { background: var(--code-block-bg) !important; border: 1px solid var(--line); border-radius: 10px; font-size: 14px; }
      #theme-reading .prose .notion-inline-code { background: var(--code-bg); color: var(--ink); padding: 2px 5px; border-radius: 4px; }
      #theme-reading .prose .notion-callout { background: var(--quote-bg); border: 0; border-radius: 8px; }
      #theme-reading .prose .notion-table { font-size: 17px; }

      @media (max-width: 1050px) {
        #theme-reading .reading-shell { grid-template-columns: 190px minmax(0, 1fr); gap: 38px; padding: 0 30px; }
      }
      @media (max-width: 800px) {
        #theme-reading .page { padding: 0 24px; }
        #theme-reading .intro h1 { font-size: 60px; }
        #theme-reading .collection-note { display: none; }
        #theme-reading .vertical-title { display: none; }
        #theme-reading .seal { width: 46px; height: 46px; font-size: 18px; }
        #theme-reading .seal-latin { width: auto; height: 30px; font-size: 15px; }
        #theme-reading .reading-shell { display: flex; flex-direction: column; margin-top: 26px; gap: 30px; padding: 0 24px; }
        #theme-reading .sidebar { width: 100%; position: static; padding: 14px 18px; }
        #theme-reading .all-articles, #theme-reading .sidebar-note { display: none; }
        #theme-reading .chapter-menu { border: 0; padding: 0; }
        #theme-reading .article-head h1 { font-size: 34px; }
        #theme-reading .year-group { grid-template-columns: 74px minmax(0, 1fr); gap: 20px; }
        #theme-reading .site-footer { padding-inline: 24px; }
      }
      @media (max-width: 520px) {
        #theme-reading { font-size: 17px; }
        #theme-reading .page { padding: 0 20px; }
        #theme-reading .masthead { padding: 17px 0; }
        #theme-reading .brand { font-size: 21px; }
        #theme-reading .masthead nav { gap: 16px; font-size: 14px; }
        #theme-reading .intro { padding: 36px 0 26px; }
        #theme-reading .intro h1 { font-size: 56px; }
        #theme-reading .intro-text { font-size: 17px; }
        #theme-reading .collection-bar { flex-direction: column; gap: 10px; }
        #theme-reading .search-box { max-width: none; width: 100%; }
        #theme-reading .lead-row { display: block; }
        #theme-reading .lead-story h2 { font-size: 25px; }
        #theme-reading .read-link { justify-content: flex-end; margin-top: 12px; }
        #theme-reading .year-group { display: block; padding: 24px 0 12px; }
        #theme-reading .year-label { font-size: 24px; margin: 0 0 6px; }
        #theme-reading .essay-row h3 { font-size: 19px; }
        #theme-reading .essay-row a { gap: 16px; padding: 14px 0; }
        #theme-reading .essay-row::before { top: 26px; }
        #theme-reading .row-cat { display: none; }
        #theme-reading .row-cover { width: 48px; height: 34px; }
        #theme-reading .intro-side { display: none; }
        #theme-reading .dot { width: 9px; height: 9px; }
        #theme-reading .photo-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        #theme-reading .post-around { grid-template-columns: 1fr; }
        #theme-reading .post-around a.next { text-align: left; }
        #theme-reading .prose { font-size: 18px; }
        #theme-reading .article-head h1 { font-size: 30px; }
        #theme-reading .site-footer { flex-direction: column; gap: 4px; padding-inline: 20px; }
      }

      /* 搜索与订阅 */
      #theme-reading .search-clear { margin-left: 12px; color: var(--muted); font-size: 13px; }
      #theme-reading .search-empty a { margin: 0 2px; }
      #theme-reading .notfound-search { margin-top: 22px; max-width: 340px; }
      #theme-reading .notfound-search .search-box { max-width: none; }
      #theme-reading .footer-right { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 14px; }
      #theme-reading .rss-link { display: inline-flex; align-items: center; gap: 5px; color: inherit; text-decoration: none; }
      #theme-reading .rss-link:hover { color: var(--ink); }
      #theme-reading .rss-icon { flex: none; }

      /* pages */
      #theme-reading .masthead { position: relative; z-index: 20; }
      #theme-reading .nav-more { position: relative; }
      #theme-reading .nav-more summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
      #theme-reading .nav-more summary::-webkit-details-marker { display: none; }
      #theme-reading .nav-more summary::after { content: ''; width: 5px; height: 5px; border-right: 1.3px solid currentColor; border-bottom: 1.3px solid currentColor; transform: translateY(-2px) rotate(45deg); transition: transform 160ms var(--ease); }
      #theme-reading .nav-more[open] summary::after { transform: translateY(1px) rotate(-135deg); }
      #theme-reading .nav-more summary:hover { color: var(--accent); }
      #theme-reading .nav-more-panel { position: absolute; right: -14px; top: calc(100% + 12px); z-index: 30; min-width: 132px; display: flex; flex-direction: column; padding: 8px; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 14px 30px -18px rgba(0,0,0,.35); animation: nav-more-in 160ms var(--ease) both; }
      #theme-reading .nav-more-panel a { padding: 7px 12px; border-radius: 6px; white-space: nowrap; }
      #theme-reading .nav-more-panel a:hover { background: var(--sidebar); }
      #theme-reading .nav-more-panel .nav-narrow { display: none; }
      @keyframes nav-more-in { from { opacity: 0; transform: translateY(-4px); } }

      #theme-reading .page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
      #theme-reading .page-head .seal { flex: none; margin-bottom: 10px; }
      #theme-reading .page-lede { margin-top: 14px; max-width: 640px; }
      #theme-reading .page-lede p { margin: 0; }
      #theme-reading .page-prose { font-size: 18px; line-height: 1.95; }
      #theme-reading .page-prose p { margin: 0 0 1em; }
      #theme-reading .page-prose ul, #theme-reading .page-prose ol { margin: 0 0 1em; padding-left: 1.3em; list-style: disc; }
      #theme-reading .page-prose ol { list-style: decimal; }
      #theme-reading .page-prose li { margin: .25em 0; }
      #theme-reading .page-prose li::marker { color: var(--accent); }
      #theme-reading .page-prose a { color: var(--accent); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
      #theme-reading .page-prose h2, #theme-reading .page-prose h3 { font-size: 20px; font-weight: 500; margin: 1.4em 0 .5em; }
      #theme-reading .page-prose blockquote { margin: 0 0 1em; padding: 10px 18px; background: var(--quote-bg); border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0; color: var(--muted); }
      #theme-reading .page-prose code { font-size: .88em; padding: 1px 5px; border-radius: 4px; background: var(--code-bg); }
      #theme-reading .page-prose img { max-width: 100%; border-radius: 6px; }
      #theme-reading .page-prose hr { border: 0; border-top: 1px solid var(--line); margin: 1.6em 0; }
      #theme-reading .page-prose > :last-child { margin-bottom: 0; }
      #theme-reading .section-label { display: flex; align-items: baseline; gap: 10px; margin: 0; font-size: 15px; font-weight: 400; letter-spacing: .12em; color: var(--muted); }
      #theme-reading .section-label span { font-size: 13px; letter-spacing: 0; font-variant-numeric: tabular-nums; }

      #theme-reading .about-intro { max-width: 720px; padding: 30px 0 34px; border-top: 1px solid var(--ink); font-size: 20px; }
      #theme-reading .now-card { position: relative; margin: 6px 0 10px; padding: 26px 30px 24px; background: var(--sidebar); border-radius: 12px; border-left: 3px solid var(--accent); }
      #theme-reading .now-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
      #theme-reading .now-head h2 { margin: 0; font-size: 22px; font-weight: 500; }
      #theme-reading .now-head span { font-size: 14px; color: var(--muted); font-variant-numeric: tabular-nums; }
      #theme-reading .now-head time { color: var(--accent); }
      #theme-reading .page-section { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 24px; padding: 28px 0; border-bottom: 1px solid var(--line); }
      #theme-reading .page-section .section-label { padding-top: 5px; }

      #theme-reading .card-grid { list-style: none; margin: 0; padding: 26px 0 0; border-top: 1px solid var(--ink); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
      #theme-reading .page-card { border: 1px solid var(--line); border-radius: 12px; background: color-mix(in srgb, var(--sidebar) 45%, transparent); transition: border-color 160ms var(--ease), transform 160ms var(--ease); }
      #theme-reading .page-card:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--line)); }
      #theme-reading .project-card { display: flex; flex-direction: column; padding: 22px 24px 20px; }
      #theme-reading .card-top { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
      #theme-reading .card-top h2 { margin: 0; font-size: 23px; font-weight: 500; line-height: 1.4; }
      #theme-reading .status-tag { flex: none; font-size: 12px; line-height: 1; padding: 5px 9px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
      #theme-reading .status-tag.live { border-color: var(--accent); color: var(--accent); }
      #theme-reading .card-desc { margin-top: 8px; font-size: 16px; line-height: 1.8; color: var(--muted); }
      #theme-reading .card-desc p { margin: 0; }
      #theme-reading .card-meta { margin: 12px 0 0; font-size: 13px; color: var(--muted); letter-spacing: .02em; }
      #theme-reading .card-links { margin: auto 0 0; padding-top: 16px; display: flex; gap: 18px; font-size: 15px; }
      #theme-reading .card-links a { color: var(--accent); }
      #theme-reading .card-links span { margin-left: 2px; font-family: Georgia, serif; }

      #theme-reading .link-card > a, #theme-reading .link-card > div { display: flex; gap: 16px; align-items: flex-start; padding: 20px 22px; height: 100%; }
      #theme-reading .link-card:hover { transform: translateY(-2px); }
      #theme-reading .link-avatar { flex: none; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; color: var(--paper); background: var(--accent); opacity: .88; }
      #theme-reading .link-text { display: flex; flex-direction: column; min-width: 0; }
      #theme-reading .link-text strong { font-weight: 500; font-size: 19px; }
      #theme-reading .link-text .card-desc { margin-top: 2px; }
      #theme-reading .link-text small { margin-top: 6px; font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      #theme-reading .shelf { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 24px; padding: 28px 0 22px; border-bottom: 1px solid var(--line); }
      #theme-reading .shelf:first-of-type { border-top: 1px solid var(--ink); }
      #theme-reading .shelf .section-label { padding-top: 4px; font-size: 18px; letter-spacing: .06em; color: var(--ink); }
      #theme-reading .shelf .section-label span { color: var(--accent); }
      #theme-reading .shelf-note { color: var(--muted); font-size: 16px; margin-bottom: 8px; }
      #theme-reading .shelf-list { list-style: none; margin: 0; padding: 0; }
      #theme-reading .shelf-list li { padding: 12px 0; }
      #theme-reading .shelf-list li + li { border-top: 1px solid var(--line-soft); }
      #theme-reading .shelf-title { margin: 0; font-size: 19px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
      #theme-reading .shelf-title a { color: inherit; }
      #theme-reading .shelf-title small { font-size: 14px; color: var(--muted); }
      #theme-reading .shelf-review { position: relative; margin: 4px 0 0; padding-left: 1.2em; font-size: 16px; color: var(--muted); }
      #theme-reading .shelf-review::before { content: '「'; position: absolute; left: 0; color: var(--accent); }
      #theme-reading .shelf-review::after { content: '」'; color: var(--accent); }
      #theme-reading .empty-line { margin: 0; padding: 10px 0; color: var(--muted); font-size: 16px; }

      #theme-reading .gallery-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 20px 72px; border-top: 1px solid var(--ink); color: var(--muted); }
      #theme-reading .gallery-empty svg { color: var(--muted); margin-bottom: 18px; }
      #theme-reading .gallery-empty p { margin: 0; font-size: 22px; color: var(--ink); }
      #theme-reading .gallery-empty small { margin-top: 6px; font-size: 15px; }
      #theme-reading .gallery-empty a { color: var(--accent); }
      #theme-reading .album-grid { list-style: none; margin: 0; padding: 30px 0 0; border-top: 1px solid var(--ink); display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px 22px; }
      #theme-reading .album-card { display: flex; flex-direction: column; gap: 4px; }
      #theme-reading .album-frame { display: block; padding: 10px 10px 30px; cursor: pointer; }
      #theme-reading .album-frame img, #theme-reading .album-blank { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: var(--line-soft); }
      #theme-reading .album-card strong { margin-top: 10px; font-weight: 500; font-size: 18px; }
      #theme-reading .album-card time { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
      #theme-reading .album-card:hover .album-frame { transform: rotate(-1deg) translateY(-2px); }

      @media (max-width: 800px) {
        #theme-reading .card-grid { grid-template-columns: 1fr; }
        #theme-reading .album-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        #theme-reading .page-section, #theme-reading .shelf { grid-template-columns: 1fr; gap: 10px; }
      }
      @media (max-width: 520px) {
        #theme-reading .masthead nav .nav-wide { display: none; }
        #theme-reading .masthead { flex-wrap: wrap; row-gap: 12px; }
        #theme-reading .masthead nav { width: 100%; justify-content: space-between; gap: 0; font-size: 15px; }
        #theme-reading .nav-more-panel .nav-narrow { display: block; }
        #theme-reading .nav-more-panel { right: -8px; }
        #theme-reading .page-head { align-items: flex-start; }
        #theme-reading .about-intro { font-size: 18px; }
        #theme-reading .now-card { padding: 20px 20px 18px; }
        #theme-reading .project-card { padding: 18px 18px 16px; }
        #theme-reading .card-top h2 { font-size: 21px; }
        #theme-reading .album-grid { gap: 20px 14px; }
      }

      /* article-page */
      /* 正文栏收到 680px（一行约 34 字），两栏整体居中 */
      #theme-reading .reading-shell { grid-template-columns: 216px minmax(0, 680px); justify-content: center; }
      /* 正文节奏：notion.css 的 .notion-text 写死了 margin: 1px 0 !important，这里按主题覆盖回来 */
      #theme-reading .prose .notion-text { margin: 0 0 1em !important; padding: 0 !important; line-height: 1.85; text-wrap: pretty; }
      #theme-reading .prose .notion-list li { line-height: 1.85; }
      #theme-reading .prose :is(.notion-list, .notion-callout, .notion-quote, .notion-toggle) .notion-text { margin: 0 0 .35em !important; }
      #theme-reading .prose :is(.notion-list, .notion-callout, .notion-quote, .notion-toggle) .notion-text:last-child { margin-bottom: 0 !important; }
      #theme-reading .article-head h1,
      #theme-reading .prose .notion-h,
      #theme-reading .related h2 { text-wrap: balance; }

      /* 导语：比正文大一档、浅一档 */
      #theme-reading .dek { margin: -6px 0 26px; font-size: 22px; line-height: 1.75; color: var(--muted); text-wrap: pretty; }

      /* 顶部阅读进度：一条 2px 朱红线，只动 transform */
      #theme-reading .read-progress { position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 50; pointer-events: none; }
      #theme-reading .read-progress span { display: block; height: 100%; background: var(--accent); transform: scaleX(0); transform-origin: 0 50%; }

      /* 目录当前章节：朱红字 + 左侧一道短竖线 */
      /* 别处有全局 .toc { flex-wrap: wrap }，条目一多就折成被截断的第二列，这里拉回单列滚动 */
      #theme-reading .toc { position: relative; flex-wrap: nowrap; }
      #theme-reading .toc a { position: relative; transition: color 160ms var(--ease); }
      #theme-reading .toc a.active { color: var(--accent); }
      #theme-reading .toc a::before { content: ''; position: absolute; left: -10px; top: .45em; bottom: .45em; width: 2px; border-radius: 1px; background: var(--accent); transform: scaleY(0); transition: transform 160ms var(--ease); }
      #theme-reading .toc a.active::before { transform: scaleY(1); }
      #theme-reading .sidebar .toc { padding-left: 12px; }
      #theme-reading .toc-mobile { display: none; }

      /* 系列目录 */
      #theme-reading .series-box { margin: -10px 0 34px; border: 1px solid var(--line); border-radius: 10px; font-size: 16px; }
      #theme-reading .series-box summary { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; padding: 12px 18px; cursor: pointer; list-style: none; }
      #theme-reading .series-box summary::-webkit-details-marker { display: none; }
      #theme-reading .series-box summary::after { content: '展开'; margin-left: auto; font-size: 13px; color: var(--muted); }
      #theme-reading .series-box details[open] summary::after { content: '收起'; }
      #theme-reading .series-tag { font-size: 13px; color: var(--paper); background: var(--accent); border-radius: 4px; padding: 0 7px; }
      #theme-reading .series-box strong { font-weight: 400; }
      #theme-reading .series-count { font-size: 14px; color: var(--muted); }
      #theme-reading .series-box ol { margin: 0; padding: 4px 18px 14px 46px; border-top: 1px solid var(--line-soft); font-size: 15px; line-height: 1.7; color: var(--muted); max-height: 360px; overflow: auto; }
      #theme-reading .series-box li { padding: 3px 0; }
      #theme-reading .series-box li::marker { font-variant-numeric: tabular-nums; }
      #theme-reading .series-box li a { color: var(--ink); }
      #theme-reading .series-box li a:hover { color: var(--accent); }
      #theme-reading .series-box li.current { color: var(--accent); }

      /* 图注：图 1 · 说明（只给带说明的图片编号） */
      #theme-reading .prose { counter-reset: figure; }
      #theme-reading .prose .notion-asset-wrapper-image .notion-asset-caption { font-size: 14px; line-height: 1.6; color: var(--muted); text-align: center; padding: 8px 0 0; }
      #theme-reading .prose .notion-asset-wrapper-image .notion-asset-caption::before { counter-increment: figure; content: '图 ' counter(figure) ' · '; color: var(--accent); }

      /* 相关文章：日期 | 标题 | 分类 的紧凑列表 */
      #theme-reading .related { margin-top: 44px; }
      #theme-reading .related h2 { font-size: 15px; font-weight: 400; color: var(--muted); letter-spacing: .12em; margin: 0 0 6px; }
      #theme-reading .related ul { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--ink); }
      #theme-reading .related li + li { border-top: 1px solid var(--line-soft); }
      #theme-reading .related a { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: 18px; align-items: baseline; padding: 12px 0; transition: transform 160ms var(--ease); }
      #theme-reading .related a:hover,
      #theme-reading .related a:focus-visible { transform: translateX(2px); }
      #theme-reading .related time { font-size: 14px; color: var(--muted); font-variant-numeric: tabular-nums; }
      #theme-reading .related-title { font-size: 17px; line-height: 1.6; overflow-wrap: anywhere; }
      #theme-reading .related-cat { font-size: 13px; color: var(--accent); white-space: nowrap; }

      @media (max-width: 1050px) {
        #theme-reading .reading-shell { grid-template-columns: 190px minmax(0, 680px); }
      }
      /* 手机：侧栏整个藏起来，目录收成标题下面的一条，默认合上 */
      @media (max-width: 800px) {
        #theme-reading .sidebar { display: none; }
        /* flex 子项默认 min-width: auto，会被正文里的宽代码块、表格撑出屏幕，整页横向溢出 */
        #theme-reading .reading-main { min-width: 0; width: 100%; }
        #theme-reading .toc-mobile { display: block; margin: -10px 0 30px; padding: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--sidebar); font-size: 15px; }
        #theme-reading .toc-mobile summary { padding: 11px 16px; color: var(--ink); }
        #theme-reading .toc-count { margin-left: 10px; font-size: 13px; color: var(--muted); }
        #theme-reading .toc-mobile .toc { padding: 2px 16px 14px 26px; max-height: 50vh; }
        #theme-reading .dek { font-size: 19px; }
        #theme-reading .article-head { padding-bottom: 30px; margin-bottom: 28px; }
      }
      @media (max-width: 520px) {
        #theme-reading .dek { font-size: 18px; margin-bottom: 20px; }
        #theme-reading .related a { grid-template-columns: minmax(0, 1fr); gap: 2px; }
        #theme-reading .related-cat { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        #theme-reading .related a,
        #theme-reading .toc a::before { transform: none; transition: none; }
        #theme-reading .toc a:not(.active)::before { opacity: 0; }
      }
      /* pagefind */
      #theme-reading #posts-wrapper + .body-hits { border-top: 1px solid var(--line); }
      #theme-reading .body-hit a { flex-direction: column; align-items: stretch; gap: 4px; }
      #theme-reading .body-hit-head { display: flex; align-items: baseline; justify-content: space-between; gap: 32px; }
      #theme-reading .body-hit-excerpt { margin: 0; font-size: 15px; line-height: 1.75; color: var(--muted); overflow-wrap: anywhere; }
      #theme-reading .body-hit-excerpt mark { background: none; color: var(--accent); border-bottom: 1px solid currentColor; padding: 0 1px; }
      @media (max-width: 520px) {
        #theme-reading .body-hit-head { flex-direction: column; gap: 2px; }
      }

      /* home-page */
      /* 最近一篇：标题和摘要在前，封面在后 */
      #theme-reading .lead-story .lead-cover { margin: 24px 0 0; }
      #theme-reading .lead-story h2 { text-wrap: balance; }
      /* 随机读一篇：计数旁边一个小链接，404 页也用 */
      #theme-reading .random-post { display: inline-flex; align-items: baseline; gap: 4px; margin-left: 14px; color: var(--accent); }
      #theme-reading .random-post > span { display: inline-block; transition: transform 160ms var(--ease); }
      #theme-reading .random-post:hover > span,
      #theme-reading .random-post:focus-visible > span { transform: translateX(2px); }
      #theme-reading .notfound-random { margin: 18px 0 0; font-size: 16px; color: var(--muted); }
      #theme-reading .notfound-random .random-post { margin-left: 2px; }
      /* 从这里读起：三张小卡，视觉重量低于最近一篇和年谱 */
      #theme-reading .reading-picks { padding: 22px 0 26px; border-bottom: 1px solid var(--line); }
      #theme-reading .reading-picks h2 { display: flex; align-items: baseline; gap: 12px; margin: 0 0 14px; font-size: 15px; font-weight: 400; color: var(--ink); }
      #theme-reading .reading-picks h2 small { font-size: 13px; color: var(--muted); }
      #theme-reading .reading-picks ol { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
      #theme-reading .reading-picks a { display: flex; align-items: center; gap: 12px; height: 100%; padding: 10px 12px; border: 1px solid var(--line-soft); border-radius: 8px; transition: border-color 160ms var(--ease), transform 160ms var(--ease); }
      #theme-reading .reading-picks a:hover,
      #theme-reading .reading-picks a:focus-visible { border-color: var(--accent); transform: translateY(-1px); }
      #theme-reading .reading-picks a:active { transform: scale(.99); transition-duration: 100ms; }
      #theme-reading .post-mark { flex: none; width: 52px; height: 52px; border-radius: 6px; object-fit: cover; }
      #theme-reading .post-mark-seal { display: inline-flex; align-items: center; justify-content: center; background: var(--sidebar); }
      #theme-reading .post-mark-seal .seal { width: 36px; height: 36px; font-size: 14px; box-shadow: inset 0 0 0 2px var(--sidebar), inset 0 0 0 3px var(--accent); }
      #theme-reading .pick-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      #theme-reading .pick-title { font-size: 16px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      #theme-reading .pick-meta { display: flex; gap: 10px; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
      #theme-reading .pick-meta > span { color: var(--accent); }
      /* 无封面文章：右侧用一枚淡印章占住封面的位置 */
      #theme-reading .row-seal { display: inline-flex; align-items: center; justify-content: center; background: var(--sidebar); }
      #theme-reading .row-seal .seal { width: 30px; height: 30px; font-size: 12px; border-width: 1.5px; border-radius: 4px; box-shadow: inset 0 0 0 2px var(--sidebar), inset 0 0 0 3px var(--accent); opacity: .72; }
      #theme-reading .row-seal .seal-latin { width: auto; height: 22px; padding: 0 6px; font-size: 11px; }
      /* 归档：按发布 / 最近更新 切换 */
      #theme-reading .archive-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
      #theme-reading .sort-toggle { display: inline-flex; gap: 4px; padding: 3px; margin-bottom: 8px; border: 1px solid var(--line); border-radius: 999px; }
      #theme-reading .sort-toggle button { border: 0; border-radius: 999px; background: transparent; color: var(--muted); font: 400 15px/1.6 var(--font); padding: 3px 14px; cursor: pointer; transition: color 160ms var(--ease), background-color 160ms var(--ease); }
      #theme-reading .sort-toggle button:hover { color: var(--accent); }
      #theme-reading .sort-toggle button.active { background: var(--accent); color: var(--paper); }
      #theme-reading .row-updated { color: var(--accent); }
      @media (max-width: 800px) {
        #theme-reading .reading-picks ol { grid-template-columns: minmax(0, 1fr); gap: 8px; }
      }
      @media (max-width: 520px) {
        #theme-reading .lead-story .lead-cover { margin-top: 18px; aspect-ratio: 16 / 9; }
        #theme-reading .random-post { margin-left: 10px; }
        #theme-reading .reading-picks h2 small { display: none; }
        #theme-reading .post-mark { width: 44px; height: 44px; }
        #theme-reading .row-seal .seal { width: 24px; height: 24px; font-size: 10px; }
      }
      @media (prefers-reduced-motion: reduce) {
        #theme-reading .reading-picks a,
        #theme-reading .random-post > span { transform: none !important; transition: none; }
      }
      /* notes & websites */
      #theme-reading .notes-count { margin: 8px 0 0; font-size: 14px; color: var(--muted); }
      #theme-reading .notes-year:first-of-type { border-top: 1px solid var(--ink); }
      #theme-reading .note-list { list-style: none; margin: 0; padding: 0; position: relative; }
      #theme-reading .note-list::before { content: ''; position: absolute; left: 4px; top: 22px; bottom: 22px; width: 1px; background: var(--line); }
      #theme-reading .note { position: relative; padding: 14px 0 18px 26px; }
      #theme-reading .note + .note { border-top: 1px solid var(--line-soft); }
      #theme-reading .note::before { content: ''; position: absolute; left: 0; top: 23px; width: 9px; height: 9px; border-radius: 50%; background: var(--paper); border: 1px solid var(--muted); }
      #theme-reading .note:first-child::before { background: var(--accent); border-color: var(--accent); }
      #theme-reading .note-meta { display: flex; align-items: baseline; gap: 12px; margin: 0 0 4px; font-size: 14px; color: var(--muted); font-variant-numeric: tabular-nums; }
      #theme-reading .note-meta time { color: var(--accent); }
      #theme-reading .note-meta small { margin-left: 6px; font-size: 13px; color: var(--muted); }
      #theme-reading .note-title { color: var(--ink); font-size: 16px; }
      #theme-reading .note-body { font-size: 17px; line-height: 1.85; }
      #theme-reading .note-body img { display: block; max-height: 420px; width: auto; margin: 6px 0 10px; border: 1px solid var(--line); }
      #theme-reading .notes-more button { background: none; border: 1px solid var(--line); border-radius: 999px; padding: 6px 16px; font: inherit; font-size: 15px; color: var(--ink); cursor: pointer; }
      #theme-reading .notes-more button:hover { border-color: var(--accent); color: var(--accent); }
      #theme-reading .bookmark-card { display: flex; flex-direction: column; margin: 4px 0 12px; padding: 12px 16px; border: 1px solid var(--line); border-radius: 10px; text-decoration: none !important; color: var(--ink) !important; }
      #theme-reading .bookmark-card:hover { border-color: var(--accent); }
      #theme-reading .bookmark-card strong { font-weight: 500; font-size: 16px; }
      #theme-reading .bookmark-card small { font-size: 13px; color: var(--muted); }

      #theme-reading .site-group { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 24px; padding: 28px 0; border-bottom: 1px solid var(--line); }
      #theme-reading .site-group:first-of-type { border-top: 1px solid var(--ink); }
      #theme-reading .site-group .section-label { padding-top: 4px; font-size: 18px; letter-spacing: .06em; color: var(--ink); }
      #theme-reading .site-group .section-label span { color: var(--accent); }
      #theme-reading .site-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      #theme-reading .site-card a { display: flex; flex-direction: column; height: 100%; padding: 16px 18px; }
      #theme-reading .site-card strong { font-weight: 500; font-size: 18px; }
      #theme-reading .site-card .card-desc { margin-top: 2px; font-size: 15px; }
      #theme-reading .site-card small { margin-top: 6px; font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #theme-reading .site-card:hover { transform: translateY(-2px); }

      @media (max-width: 800px) {
        #theme-reading .site-group { grid-template-columns: 1fr; gap: 12px; }
      }
      @media (max-width: 520px) {
        #theme-reading .site-grid { grid-template-columns: 1fr; }
        #theme-reading .note { padding-left: 22px; }
      }
      /* article-page：第二批（字号、复制链接、阅读量、过时提示、脚注、键盘） */
      /* 正文第一个块不要上边距：一级标题自带的 1.8em 上边距 + 顶线会和页头分隔线叠成一大块空白、两条线 */
      #theme-reading .prose .notion-page > :is(.notion-viewport:first-child + *, :first-child:not(.notion-viewport)) { margin-top: 0 !important; }
      #theme-reading .prose .notion-page > :is(.notion-viewport:first-child + .notion-h1, .notion-h1:first-child) { border-top: 0; padding-top: 0; }

      /* 正文字号三档：默认档仍是上面的 20px / 手机 18px，没 JS 时不受影响 */
      html[data-reading-size='s'] #theme-reading .prose { font-size: 18px; }
      html[data-reading-size='l'] #theme-reading .prose { font-size: 22px; }
      #theme-reading .font-size { display: flex; align-items: center; gap: 6px; border-top: 1px solid var(--line); margin-top: 18px; padding-top: 14px; font-size: 13px; }
      #theme-reading .font-size > span { margin-right: auto; }
      #theme-reading .font-size button { min-width: 30px; height: 28px; padding: 0 6px; border: 1px solid var(--line); border-radius: 6px; background: transparent; color: var(--muted); font: inherit; cursor: pointer; }
      #theme-reading .font-size button:hover { color: var(--accent); border-color: var(--accent); }
      #theme-reading .font-size button[aria-pressed='true'] { color: var(--paper); background: var(--accent); border-color: var(--accent); }
      #theme-reading .font-size-mobile { display: none; }

      /* 复制链接 / 分享 */
      #theme-reading .share-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; }
      #theme-reading .share-row button { font: inherit; font-size: 14px; color: var(--accent); background: transparent; border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line)); border-radius: 999px; padding: 3px 14px; cursor: pointer; }
      #theme-reading .share-row button:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
      #theme-reading .share-row input { flex: 1 1 240px; min-width: 0; font: inherit; font-size: 14px; color: var(--ink); background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 4px 10px; }

      /* 阅读量、过时提示 */
      #theme-reading .pageviews { font-variant-numeric: tabular-nums; }
      #theme-reading .stale-note { margin: 22px 0 0; padding: 10px 16px; border-left: 3px solid var(--accent); background: var(--quote-bg); border-radius: 0 8px 8px 0; font-size: 15px; line-height: 1.75; color: var(--muted); }

      /* 最近评论 */
      #theme-reading .recent-comments { margin-top: 40px; }
      #theme-reading .recent-comments h2 { font-size: 15px; font-weight: 400; color: var(--muted); letter-spacing: .12em; margin: 0 0 6px; }
      #theme-reading .recent-comments ul { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
      #theme-reading .recent-comments li + li { border-top: 1px solid var(--line-soft); }
      #theme-reading .recent-comments a { display: flex; gap: 12px; padding: 10px 0; font-size: 15px; }
      #theme-reading .recent-comments strong { font-weight: 400; color: var(--accent); white-space: nowrap; }
      #theme-reading .recent-comments span { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      /* 脚注 */
      #theme-reading .fn-ref { font-size: .7em; line-height: 0; margin: 0 1px; }
      #theme-reading .fn-ref a, #theme-reading .fn-back { color: var(--accent); }
      #theme-reading .prose .fn-def { font-size: .85em; color: var(--muted); scroll-margin-top: 80px; }
      #theme-reading .fn-num { margin-right: .4em; color: var(--accent); font-variant-numeric: tabular-nums; }
      #theme-reading .fn-ref a:target, #theme-reading .prose .fn-def:target { background: color-mix(in srgb, var(--accent) 14%, transparent); }
      #theme-reading .fn-ref a { scroll-margin-top: 80px; }

      /* 键盘：跳到正文 + 统一的焦点框 */
      #theme-reading .skip-link { position: fixed; left: 16px; top: 10px; z-index: 60; padding: 6px 14px; border-radius: 6px; background: var(--ink); color: var(--paper); font-size: 15px; transform: translateY(-160%); transition: transform 160ms var(--ease); }
      #theme-reading .skip-link:focus { transform: none; color: var(--paper); }
      #theme-reading :is(a, button, summary, input):focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 3px; }

      @media (max-width: 800px) {
        #theme-reading .font-size-mobile { display: flex; margin: -14px 0 28px; padding-top: 0; border-top: 0; }
      }
      @media (max-width: 520px) {
        html[data-reading-size='s'] #theme-reading .prose { font-size: 16px; }
        html[data-reading-size='l'] #theme-reading .prose { font-size: 20px; }
      }
      @media (prefers-reduced-motion: reduce) {
        #theme-reading .skip-link { transition: none; }
      }
    `}</style>
  )
}

export { Style }
