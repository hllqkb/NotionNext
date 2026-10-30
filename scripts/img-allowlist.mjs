/**
 * 生成图片代理白名单：out/img-allowlist.json
 * 在 yarn export 的 next build 之后运行，扫 out/ 下所有 HTML 和页面数据 JSON 里的 /img/<table>/<blockId>?src= 地址。
 * Notion 上传文件记 blockId，外链图记「blockId 完整地址」（格式见 lib/db/notion/imgProxy.js 的 allowlistKey）。
 * functions/img/[[path]].js 只代理名单里的条目，防止别人借本站域名转发任意 Notion 公开页面或外站的图。
 * 名单随每次部署一起发布，预览部署和生产各用各的，不需要 KV。
 */
import fs from 'node:fs'
import path from 'node:path'
import { allowlistKey, normalizeUuid } from '../lib/db/notion/imgProxy.js'

const OUT_DIR = 'out'
const OUTPUT = path.join(OUT_DIR, 'img-allowlist.json')
// src 是 encodeURIComponent 过的，不含引号、& 和空白；JSON 里可能被转义成 \u0026 之类，遇到反斜杠也停
const PATTERN =
  /\/img\/(?:block|collection)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\?src=([^"'&\s\\<>]+))?/g

const decode = value => {
  try {
    return decodeURIComponent(value)
  } catch {
    return ''
  }
}

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(html|json)$/.test(entry.name) ? [full] : []
  })

const ids = new Set()
let files = 0
for (const file of walk(OUT_DIR)) {
  if (file === OUTPUT) continue
  files++
  for (const [, id, src] of fs.readFileSync(file, 'utf8').matchAll(PATTERN)) {
    // 没带 src 的旧写法只记 blockId，和原来一样
    ids.add((src && allowlistKey(normalizeUuid(id), decode(src))) || id)
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify([...ids].sort()))
const external = [...ids].filter(key => key.includes(' ')).length
console.log(
  `img-allowlist: ${ids.size - external} 个 blockId + ${external} 个外链图（扫描 ${files} 个文件）-> ${OUTPUT}`
)
