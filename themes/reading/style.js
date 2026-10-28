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
    `}</style>
  )
}

export { Style }
