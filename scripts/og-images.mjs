/**
 * 给每篇文章画一张 1200×630 的分享图，写到 out/og/<slug>.png。
 * 在 yarn export 的 next build 之后运行：静态导出用不了 next/og 的边缘函数，这里用 satori 排版成 SVG，再用 resvg 转 PNG。
 * 文章清单由首页 getStaticProps 写到 .next/og-posts.json（lib/build/ogManifest.js）。
 * 字体用 public/fonts 下自托管的霞鹜文楷 woff2 子集，只加载标题里实际用到的子集；
 * satori 0.26 读不了 woff2，先用 wawoff2 解成 ttf。
 * 任何一篇画失败都退回站点默认图，不让构建失败。
 */
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import wawoff2 from 'wawoff2'

const MANIFEST = '.next/og-posts.json'
const OUT_DIR = 'out'
const FALLBACK_IMAGE = path.join(OUT_DIR, 'og-default.png')
const FONT_DIR = 'public/fonts/lxgw-wenkai'
const FONT_CSS = path.join(FONT_DIR, 'lxgwwenkai.css')
const WIDTH = 1200
const HEIGHT = 630

// reading 主题的纸色、墨色、朱红（themes/reading/style.js 的浅色变量）
const PAPER = '#f7f6f0'
const INK = '#34352e'
const MUTED = '#78786e'
const LINE = '#dfdfd4'
const ACCENT = '#aa533b'

const formatDate = value => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const h = (type, style, children) => ({ type, props: { style, children } })

const titleSize = title => {
  const len = [...title].length
  if (len <= 14) return 76
  if (len <= 28) return 64
  return 54
}

const seal = text => {
  const raw = String(text || '').trim()
  const latin = /^[\x00-\x7F]+$/.test(raw)
  const label = latin ? raw.slice(0, 8) : raw.slice(0, 2)
  return h(
    'div',
    {
      display: 'flex',
      padding: 4,
      border: `3px solid ${ACCENT}`,
      borderRadius: 8,
      transform: 'rotate(-4deg)',
      opacity: 0.9
    },
    h(
      'div',
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1.5px solid ${ACCENT}`,
        borderRadius: 4,
        color: ACCENT,
        fontSize: latin ? 30 : 34,
        letterSpacing: '0.08em',
        padding: latin ? '6px 18px' : '8px 12px',
        flexDirection: latin ? 'row' : 'column',
        lineHeight: 1.1
      },
      latin ? label : [...label].map(c => h('div', {}, c))
    )
  )
}

function card({ site, post, families }) {
  const meta = [post.category, formatDate(post.publishDate)].filter(Boolean).join(' · ')
  return h(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      padding: 32,
      backgroundColor: PAPER,
      fontFamily: families[400]
    },
    h(
      'div',
      {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: `1px solid ${LINE}`,
        padding: '52px 64px 44px'
      },
      [
        h('div', { display: 'flex', alignItems: 'center', fontSize: 28, color: ACCENT }, [
          h('div', { width: 40, height: 3, backgroundColor: ACCENT, marginRight: 18 }),
          h('div', {}, meta)
        ]),
        h(
          'div',
          {
            display: 'block',
            fontSize: titleSize(post.title),
            fontFamily: families[700],
            fontWeight: 700,
            color: INK,
            lineHeight: 1.35,
            lineClamp: 3
          },
          post.title
        ),
        h('div', { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }, [
          h('div', { display: 'flex', flexDirection: 'column' }, [
            h('div', { fontSize: 30, color: INK }, site.title),
            h('div', { fontSize: 22, color: MUTED, marginTop: 6 }, site.host)
          ]),
          seal(site.seal)
        ])
      ]
    )
  )
}

/** 解析 @font-face，得到每个子集文件的字重和 unicode-range */
function readFontFaces() {
  const css = fs.readFileSync(FONT_CSS, 'utf8')
  const faces = []
  for (const block of css.match(/@font-face\s*{[^}]*}/g) || []) {
    const weight = Number(block.match(/font-weight:\s*(\d+)/)?.[1] || 400)
    const file = block.match(/url\(['"]?\.\/([^'")]+)['"]?\)/)?.[1]
    const range = block.match(/unicode-range:\s*([^;}]+)/)?.[1]
    if (!file || !range) continue
    const ranges = range.split(',').map(part => {
      const [start, end] = part.trim().replace(/^U\+/i, '').split('-')
      return [parseInt(start, 16), parseInt(end || start, 16)]
    })
    faces.push({ weight, file: path.join(FONT_DIR, file), ranges })
  }
  return faces
}

/** 只加载用到的子集：标题用粗体，其余文字用常规体 */
async function loadFonts(faces, textByWeight) {
  const fonts = []
  const missing = new Set()
  for (const [weight, text] of Object.entries(textByWeight)) {
    const candidates = faces.filter(f => f.weight === Number(weight))
    const used = new Set()
    for (const char of new Set(text)) {
      const code = char.codePointAt(0)
      if (code < 0x21) continue
      const face = candidates.find(f => f.ranges.some(([a, b]) => code >= a && code <= b))
      if (face) used.add(face)
      else missing.add(char)
    }
    for (const face of used) {
      const data = Buffer.from(await wawoff2.decompress(fs.readFileSync(face.file)))
      // 同名的多个子集 satori 只认第一个，缺字不会去别的子集找；每个子集单独起名，再在 fontFamily 里全部列上
      fonts.push({ name: `wenkai-${fonts.length}`, data, weight: face.weight, style: 'normal' })
    }
  }
  return { fonts, missing: [...missing] }
}

async function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.log(`[OG] 没有 ${MANIFEST}，跳过分享图（只在 yarn export 时生成）`)
    return
  }
  const { site, posts } = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  const started = Date.now()

  const regularText = [site.title, site.host, site.seal, ...posts.map(p => `${p.category} · ${formatDate(p.publishDate)}`)].join('')
  const boldText = posts.map(p => p.title).join('')
  // 字体读不出来时 fonts 为空，下面每篇都会画失败、退回默认图，og:image 不会指向不存在的文件
  const { fonts, missing } = await loadFonts(readFontFaces(), { 400: regularText, 700: boldText }).catch(error => {
    console.warn('[OG] 字体载入失败', error)
    return { fonts: [], missing: [] }
  })
  if (missing.length) console.warn(`[OG] 霞鹜文楷子集里没有这些字，会画成空白：${missing.join(' ')}`)
  const families = {}
  for (const weight of [400, 700]) {
    families[weight] = fonts.filter(f => f.weight === weight).map(f => f.name).join(', ')
  }
  console.log(`[OG] 载入 ${fonts.length} 个字体子集，${Date.now() - started}ms`)

  let ok = 0
  let failed = 0
  const renderStart = Date.now()
  for (const post of posts) {
    const target = path.join(OUT_DIR, 'og', `${post.slug}.png`)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    try {
      const svg = await satori(card({ site, post, families }), { width: WIDTH, height: HEIGHT, fonts })
      // satori 已把文字转成路径，resvg 不用字体；默认每次都扫一遍系统字体，单张要多花一秒多
      const png = new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng()
      fs.writeFileSync(target, png)
      ok++
    } catch (error) {
      failed++
      console.warn(`[OG] ${post.slug} 画图失败，改用默认图：${error.message}`)
      if (fs.existsSync(FALLBACK_IMAGE)) fs.copyFileSync(FALLBACK_IMAGE, target)
    }
  }
  const renderMs = Date.now() - renderStart
  const each = posts.length ? Math.round(renderMs / posts.length) : 0
  console.log(`[OG] 生成 ${ok} 张，失败 ${failed} 张；绘制共 ${renderMs}ms，单篇约 ${each}ms；总耗时 ${Date.now() - started}ms`)
}

main().catch(error => {
  // 分享图不是上线的必要条件，出错只记日志
  console.error('[OG] 分享图生成中断', error)
})
