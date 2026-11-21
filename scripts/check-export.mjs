/**
 * 导出后的保险：数一下 out/article 下的文章页，太少就让构建失败。
 *
 * 读不到 Notion 数据时（登录令牌过期、Notion 抽风）构建不会报错，只会导出一个空站，
 * 部署上去就把线上文章全顶掉了。这里失败后 Cloudflare 保留上一次部署。
 * 门槛默认 30 篇，用 EXPORT_MIN_ARTICLES 调。
 */
import { readdirSync } from 'node:fs'
import path from 'node:path'

const ARTICLE_DIR = path.resolve(process.cwd(), 'out', 'article')
const min = Number(process.env.EXPORT_MIN_ARTICLES || 30)

const countHtml = dir => {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return 0
  }
  return entries.reduce((total, entry) => {
    if (entry.isDirectory()) return total + countHtml(path.join(dir, entry.name))
    return total + (entry.name.endsWith('.html') ? 1 : 0)
  }, 0)
}

const count = countHtml(ARTICLE_DIR)
if (count < min) {
  console.error(
    `[check-export] out/article 只有 ${count} 个页面，少于 ${min}。` +
      '多半是没读到 Notion 数据（NOTION_TOKEN_V2 过期？），构建中止，线上保持上一次部署。'
  )
  process.exit(1)
}
console.log(`[check-export] out/article 有 ${count} 个页面`)
