/**
 * Notion 图片同站代理的地址格式，构建端（mapImgUrl、scripts/img-allowlist.mjs）
 * 和 Cloudflare Pages Function（functions/img/[[path]].js）共用，不要引入 @/ 别名或其他依赖。
 *
 * 地址：/img/<table>/<blockId>?src=<encodeURIComponent(原图标识)>
 * 原图标识有两类：Notion 自己的上传文件（attachment / S3），和正文里插的外链图（cnblogs、csdnimg 等）。
 * 两类都由 Function 在 Cloudflare 边缘经 Notion /image/ 取图，浏览器只连本站。
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
// Notion 自己的域名不当外链代理：这些地址要么已经是 /image/ 中转，要么是 page-cover 等静态图，保持原样
const NOTION_SELF_HOST = /(^|\.)notion\.(so|site|com)$/i
// Unsplash 自带按参数缩放，NotionPage 放大时靠 compressImage 改 Notion /image/ 地址里的 width 取高清图，保持原路径
const KEEP_NOTION_IMAGE_HOSTS = ['images.unsplash.com']

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
 * 正文外链图：http(s)、无账号密码和端口、不是 Notion 自己的域名或 Unsplash；返回完整地址（含 query，外链地址本身就是身份），不合法返回 null
 * @param {string} src
 * @returns {string|null}
 */
export function externalSourceKey(src) {
  if (typeof src !== 'string' || stableSourceKey(src)) return null
  let url
  try {
    url = new URL(src)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null
  if (url.username || url.password || url.port) return null
  if (NOTION_SELF_HOST.test(url.hostname)) return null
  if (KEEP_NOTION_IMAGE_HOSTS.includes(url.hostname)) return null
  return url.href
}

/**
 * Function 用的缓存键：Notion 文件去签名，外链用完整地址；都不认返回 null
 * @param {string} src
 * @returns {string|null}
 */
export const proxySourceKey = src =>
  stableSourceKey(src) || externalSourceKey(src)

/**
 * 白名单条目：Notion 文件只认 blockId；外链要求 blockId 和完整地址成对出现过，
 * 别人拿本站的 blockId 也拼不出任意外链转发
 * @param {string} blockId 已规范化的 UUID
 * @param {string} src
 * @returns {string|null}
 */
export function allowlistKey(blockId, src) {
  if (stableSourceKey(src)) return blockId
  const external = externalSourceKey(src)
  return external ? `${blockId} ${external}` : null
}

/**
 * 能走同站代理时返回 /img/... 相对地址，否则返回 null（调用方沿用 Notion /image/ 中转）
 * @param {string} src 原图标识：attachment:<uuid>:<文件名>、Notion S3 地址或外链图地址
 * @param {string} table block | collection
 * @param {string} id 图片所在 block / collection 的 id
 * @returns {string|null}
 */
export function buildImgProxyPath(src, table, id) {
  if (!isProxyTable(table) || !isUuid(id) || !proxySourceKey(src)) return null
  // encodeURIComponent 不编码单引号，HTML 属性里会变成 &#x27;，白名单脚本就截不全；这里补编成 %27
  const encoded = encodeURIComponent(src).replace(/'/g, '%27')
  return `${IMG_PROXY_PREFIX}${table}/${normalizeUuid(id)}?src=${encoded}`
}
