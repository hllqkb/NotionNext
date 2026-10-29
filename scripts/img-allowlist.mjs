/**
 * 生成 Notion 图片代理的 blockId 白名单：out/img-allowlist.json
 * 在 yarn export 的 next build 之后运行，扫 out/ 下所有 HTML 和页面数据 JSON 里的 /img/<table>/<blockId> 地址。
 * functions/img/[[path]].js 只代理名单里的 blockId，防止别人借本站域名转发任意 Notion 公开页面的图。
 * 名单随每次部署一起发布，预览部署和生产各用各的，不需要 KV。
 */
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = 'out'
const OUTPUT = path.join(OUT_DIR, 'img-allowlist.json')
const PATTERN =
  /\/img\/(?:block|collection)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g

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
  for (const match of fs.readFileSync(file, 'utf8').matchAll(PATTERN)) {
    ids.add(match[1])
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify([...ids].sort()))
console.log(`img-allowlist: ${ids.size} 个 blockId（扫描 ${files} 个文件）-> ${OUTPUT}`)
