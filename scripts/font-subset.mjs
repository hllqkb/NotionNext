/**
 * 按本站实际用字给霞鹜文楷切子集，在 yarn export 的 next build 之后运行。
 * 扫 out/ 下所有 HTML 的正文文字：
 * - 首页用到的字 + ASCII + 常用标点切成一份「站点核心」常规体，所有页面共用（浏览器缓存一次）
 * - 每页再切一份「本页字 - 核心字」常规体，和一份本页加粗文字（b/strong）的粗体
 * 两部分 unicode-range 不重叠，同属 'LXGW WenKai' 一个 family；子集里没有的字由 --font 后面的系统楷体/宋体逐字回退。
 * @font-face 直接内联进每个 HTML 的 <style id="wenkai-font">，首访不多一次 CSS 请求；
 * 客户端跳转时由 themes/reading/components/PageFont.js 按路由加载 out/font-css/<路由>.css。
 * woff2 文件名带内容 hash，放在 /fonts/wenkai/ 下，吃 public/_headers 里 /fonts/* 的一年 immutable 缓存。
 * READING_FONT_SYNTH_BOLD=true 时不生成粗体，加粗交给浏览器合成。
 * 切子集失败时退回给每页挂上旧的整套 unicode-range 切片 CSS，不让构建失败。
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import subsetFont from 'subset-font'
import wawoff2 from 'wawoff2'

const OUT_DIR = 'out'
const SRC_DIR = 'assets/fonts/lxgw-wenkai'
const FONT_URL_DIR = '/fonts/wenkai'
const PAGE_CSS_DIR = 'font-css'
const CACHE_DIR = '.next/cache/wenkai-subsets'
const LEGACY_CSS = '/fonts/lxgw-wenkai/lxgwwenkai.css'
const FAMILY = 'LXGW WenKai'
const SYNTH_BOLD = process.env.READING_FONT_SYNTH_BOLD === 'true'
const STYLE_ID = 'wenkai-font'
// 首页不一定出现、但几乎每篇都会用到的标点，加上只在客户端渲染、静态 HTML 里没有的界面文字（深浅色切换、分享按钮）
const EXTRA_CORE = '，。、；：？！“”‘’（）《》〈〉「」『』【】—…·～￥％浅色深色分享'
// 有评论区的页面（静态 HTML 里有 comments-hint 占位），评论组件在客户端才渲染：
// Waline 3.16 zh-CN 界面文案（@waline/client dist 里的 locale 原文）和加粗的评论源标签
const COMMENT_MARK = 'comments-hint'
const COMMENT_TEXT =
  '昵称,昵称不能少于3个字符,邮箱,请填写正确的邮件地址,网址,可选,欢迎评论,来发评论吧~,提交,喜欢,取消喜欢,回复,取消回复,评论,刷新,加载更多...,预览,表情,上传图片,秒前,分钟前,小时前,天前,刚刚,正在上传,登录,退出,博主,置顶,字,评论字数应在 $0 到 $1 字之间！当前字数：$2,匿名,潜水,冒泡,吐槽,活跃,话痨,传说,表情包,搜索表情包,个人资料,通过,待审核,垃圾,取消置顶,按倒序,按正序,按热度,你认为这篇文章怎么样？,评论正在审核中，当前仅自己可见，审核通过后公开可见。,订阅本文评论,订阅本站评论,订阅你的评论回复0123456789'
const COMMENT_BOLD = 'Waline'

const WEIGHTS = [
  { key: 'r', weight: 400, file: 'LXGWWenKai-Regular.woff2', local: ['LXGW WenKai', 'LXGWWenKai-Regular'] },
  { key: 'b', weight: 700, file: 'LXGWWenKai-Bold.woff2', local: ['LXGW WenKai Bold', 'LXGWWenKai-Bold'] }
]

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.name.endsWith('.html') ? [full] : []
  })

// out/index.html → /，out/article/a.html → /article/a，out/a/index.html → /a
const routeOf = file => {
  const rel = path.relative(OUT_DIR, file).split(path.sep).join('/')
  const route = '/' + rel.replace(/\.html$/, '').replace(/(^|\/)index$/, '')
  return route.length > 1 ? route.replace(/\/$/, '') : '/'
}

const pageCssPath = route => `${route === '/' ? '/index' : route}.css`

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const decode = text =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
    if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? m
    const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
    return Number.isFinite(n) && n <= 0x10ffff ? String.fromCodePoint(n) : m
  })

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'template', 'svg', 'textarea'])
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
// 渲染成 600 以上字重的元素：加粗标签、表头、Tailwind 加粗类、notion.css 里加粗的几个标题类
const BOLD_TAGS = new Set(['b', 'strong', 'th'])
const BOLD_CLASS = /(?:^|\s)(?:font-(?:semibold|bold|extrabold|black)|notion-title|notion-collection-header-title|notion-tabs-tab)(?:\s|$)/

/** 取 <body> 里渲染出来的文字，返回全部码位和加粗文字码位 */
const collectText = html => {
  const all = new Set()
  const bold = new Set()
  const start = html.search(/<body[\s>]/i)
  const body = start >= 0 ? html.slice(start) : html
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|<!--[\s\S]*?-->/g
  // 打开中的元素：{ name, bold }；skip 记录正在跳过的 script/style 等
  const stack = []
  let skip = null
  let last = 0
  const addText = text => {
    if (skip || !text) return
    const isBold = stack.some(e => e.bold)
    for (const ch of decode(text)) {
      const cp = ch.codePointAt(0)
      if (cp < 0x20 || /\s/.test(ch)) continue
      all.add(cp)
      if (isBold) bold.add(cp)
    }
  }
  for (const m of body.matchAll(tag)) {
    addText(body.slice(last, m.index))
    last = m.index + m[0].length
    if (!m[2]) continue
    const name = m[2].toLowerCase()
    const selfClosing = /\/\s*$/.test(m[3])
    if (skip) {
      if (m[1] && name === skip) skip = null
      continue
    }
    if (m[1]) {
      const i = stack.map(e => e.name).lastIndexOf(name)
      if (i >= 0) stack.length = i
    } else if (SKIP_TAGS.has(name)) {
      if (!selfClosing) skip = name
    } else if (!VOID_TAGS.has(name) && !selfClosing) {
      const cls = m[3].match(/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/)
      stack.push({ name, bold: BOLD_TAGS.has(name) || BOLD_CLASS.test(cls ? cls[1] ?? cls[2] : '') })
    }
  }
  addText(body.slice(last))
  return { all, bold }
}

/** 读 TTF 的 cmap（format 4 / 12），得到字体实际有字形的码位 */
const coverageOf = ttf => {
  const view = new DataView(ttf.buffer, ttf.byteOffset, ttf.byteLength)
  const numTables = view.getUint16(4)
  let cmap = -1
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16
    if (String.fromCharCode(...ttf.subarray(rec, rec + 4)) === 'cmap') cmap = view.getUint32(rec + 8)
  }
  if (cmap < 0) throw new Error('cmap not found')
  const set = new Set()
  const count = view.getUint16(cmap + 2)
  for (let i = 0; i < count; i++) {
    const offset = cmap + view.getUint32(cmap + 4 + i * 8 + 4)
    const format = view.getUint16(offset)
    if (format === 12) {
      const groups = view.getUint32(offset + 12)
      for (let g = 0; g < groups; g++) {
        const p = offset + 16 + g * 12
        for (let cp = view.getUint32(p); cp <= view.getUint32(p + 4); cp++) set.add(cp)
      }
    } else if (format === 4) {
      const segX2 = view.getUint16(offset + 6)
      const ends = offset + 14
      const starts = ends + segX2 + 2
      for (let s = 0; s < segX2; s += 2) {
        const end = view.getUint16(ends + s)
        for (let cp = view.getUint16(starts + s); cp <= end && cp !== 0xffff; cp++) set.add(cp)
      }
    }
  }
  return set
}

const toRange = cps => {
  const sorted = [...cps].sort((a, b) => a - b)
  const parts = []
  for (let i = 0; i < sorted.length; i++) {
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++
    const hex = n => n.toString(16)
    parts.push(j > i ? `U+${hex(sorted[i])}-${hex(sorted[j])}` : `U+${hex(sorted[i])}`)
    i = j
  }
  return parts.join(',')
}

const sha = data => crypto.createHash('sha256').update(data).digest('hex')

const run = async () => {
  const started = Date.now()
  const pages = walk(OUT_DIR)
    .filter(file => !file.startsWith(path.join(OUT_DIR, 'pagefind')))
    .map(file => {
      const html = fs.readFileSync(file, 'utf8')
      return { file, route: routeOf(file), html, ...collectText(html) }
    })
  const home = pages.find(p => p.route === '/')
  if (!home) throw new Error('out/index.html not found')

  const weights = []
  for (const w of WEIGHTS) {
    if (w.key === 'b' && SYNTH_BOLD) continue
    const source = fs.readFileSync(path.join(SRC_DIR, w.file))
    const ttf = Buffer.from(await wawoff2.decompress(source))
    weights.push({ ...w, sourceHash: sha(source).slice(0, 16), ttf, coverage: coverageOf(ttf) })
  }
  const [regular, bold] = weights
  const cover = (set, w) => new Set([...set].filter(cp => w.coverage.has(cp)))

  const coreSet = new Set(home.all)
  for (let cp = 0x20; cp < 0x7f; cp++) coreSet.add(cp)
  for (const ch of EXTRA_CORE) coreSet.add(ch.codePointAt(0))
  const core = cover(coreSet, regular)

  fs.mkdirSync(path.join(OUT_DIR, FONT_URL_DIR), { recursive: true })
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const made = new Map()
  let subsetCount = 0
  let cacheHits = 0
  let fontBytes = 0

  /** 切一份子集，返回 @font-face；相同字集只切一次，结果按字集缓存到 .next/cache */
  const face = async (w, cps) => {
    if (cps.size === 0) return ''
    const text = String.fromCodePoint(...[...cps].sort((a, b) => a - b))
    const key = `${w.key}:${text}`
    if (!made.has(key)) {
      const cacheFile = path.join(CACHE_DIR, `${sha(w.sourceHash + key)}.woff2`)
      let font
      if (fs.existsSync(cacheFile)) {
        font = fs.readFileSync(cacheFile)
        cacheHits++
      } else {
        font = await subsetFont(w.ttf, text, { targetFormat: 'woff2' })
        fs.writeFileSync(cacheFile, font)
        subsetCount++
      }
      const name = `${w.key}-${sha(font).slice(0, 12)}.woff2`
      const target = path.join(OUT_DIR, FONT_URL_DIR, name)
      if (!fs.existsSync(target)) {
        fs.writeFileSync(target, font)
        fontBytes += font.length
      }
      made.set(key, `${FONT_URL_DIR}/${name}`)
    }
    const local = w.local.map(n => `local('${n}')`).join(',')
    return `@font-face{font-family:'${FAMILY}';font-style:normal;font-weight:${w.weight};font-display:swap;src:${local},url('${made.get(key)}') format('woff2');unicode-range:${toRange(cps)}}`
  }

  const coreCss = await face(regular, core)
  let pageCssCount = 0
  const codepoints = text => [...text].map(ch => ch.codePointAt(0))
  for (const page of pages) {
    if (page.html.includes(COMMENT_MARK)) {
      codepoints(COMMENT_TEXT).forEach(cp => page.all.add(cp))
      codepoints(COMMENT_BOLD).forEach(cp => page.bold.add(cp))
    }
    const rest = new Set([...cover(page.all, regular)].filter(cp => !core.has(cp)))
    let pageCss = await face(regular, rest)
    if (bold) pageCss += await face(bold, cover(page.bold, bold))
    const cssFile = path.join(OUT_DIR, PAGE_CSS_DIR, pageCssPath(page.route))
    fs.mkdirSync(path.dirname(cssFile), { recursive: true })
    fs.writeFileSync(cssFile, pageCss)
    pageCssCount++
    inject(page, coreCss + pageCss)
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `[font-subset] ${pages.length} pages, core ${core.size} chars, ${made.size} subsets (${subsetCount} new, ${cacheHits} cached), ` +
      `${(fontBytes / 1024).toFixed(0)} KiB woff2, ${pageCssCount} page css, synth bold ${SYNTH_BOLD}, ${seconds}s`
  )
}

const STYLE_RE = new RegExp(`<style id="${STYLE_ID}">[\\s\\S]*?</style>|<link id="${STYLE_ID}"[^>]*>`, 'g')

const inject = (page, tag) => {
  const html = page.html.replace(STYLE_RE, '')
  const block = tag.startsWith('<') ? tag : `<style id="${STYLE_ID}">${tag}</style>`
  fs.writeFileSync(page.file, html.replace('</head>', `${block}</head>`))
}

run().catch(error => {
  console.error('[font-subset] failed, falling back to legacy unicode-range CSS:', error)
  for (const file of walk(OUT_DIR)) {
    const html = fs.readFileSync(file, 'utf8')
    inject({ file, html }, `<link id="${STYLE_ID}" rel="stylesheet" href="${LEGACY_CSS}">`)
  }
})
