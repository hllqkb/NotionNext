/**
 * Notion 图片同站代理的地址格式，构建端（mapImgUrl、scripts/img-allowlist.mjs）
 * 和 Cloudflare Pages Function（functions/img/[[path]].js）共用，不要引入 @/ 别名或其他依赖。
 *
 * 地址：/img/<table>/<blockId>?src=<encodeURIComponent(原图标识)>
 */

export const IMG_PROXY_PREFIX = '/img/'

const UUID =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
const TABLES = ['block', 'collection']
// Notion 上传文件可能出现的地址：S3 两种写法、旧图床、新文件 CDN
const NOTION_FILE_HOSTS = [
  'prod-files-secure.s3.us-west-2.amazonaws.com',
  's3.us-west-2.amazonaws.com',
  's3-us-west-2.amazonaws.com',
  'secure.notion-static.com',
  'file.notion.so',
  'file.notion.com'
]
const ATTACHMENT = /^attachment:([0-9a-f-]{32,36}):(.+)$/i

export const isUuid = id => typeof id === 'string' && UUID.test(id)

export const isProxyTable = table => TABLES.includes(table)

export const normalizeUuid = id => {
  const hex = id.replace(/-/g, '').toLowerCase()
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * 只认 Notion 自己的上传文件；返回去掉签名参数的稳定路径（Function 用作缓存键），不合法返回 null
 * @param {string} src
 * @returns {string|null}
 */
export function stableSourceKey(src) {
  if (typeof src !== 'string') return null
  const attachment = src.match(ATTACHMENT)
  if (attachment) return isUuid(attachment[1]) ? src : null

  let url
  try {
    url = new URL(src)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    return null
  }
  if (!NOTION_FILE_HOSTS.includes(url.hostname)) return null
  // s3 path-style 地址只放行 Notion 的桶
  if (
    url.hostname.startsWith('s3') &&
    !/^\/(secure\.notion-static\.com|prod-files-secure)\//.test(url.pathname)
  ) {
    return null
  }
  return url.origin + url.pathname
}

/**
 * 能走同站代理时返回 /img/... 相对地址，否则返回 null（调用方沿用 Notion /image/ 中转）
 * @param {string} src 原图标识：attachment:<uuid>:<文件名> 或 Notion S3 地址
 * @param {string} table block | collection
 * @param {string} id 图片所在 block / collection 的 id
 * @returns {string|null}
 */
export function buildImgProxyPath(src, table, id) {
  if (!isProxyTable(table) || !isUuid(id) || !stableSourceKey(src)) return null
  return `${IMG_PROXY_PREFIX}${table}/${normalizeUuid(id)}?src=${encodeURIComponent(src)}`
}
