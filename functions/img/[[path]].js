/**
 * Notion 图片同站代理：/img/<table>/<blockId>?src=<编码后的原图标识>，地址由 mapImgUrl 在构建时生成
 *
 * 国内直连 www.notion.so 慢且不稳，页面里的图片改由本站转发，并缓存在 Cloudflare 边缘。
 * - Notion 上传文件：src 是 attachment:<uuid>:<文件名>，或 Notion 的 S3 / 文件 CDN 地址；blockId 在白名单里即可
 * - 正文外链图：src 是 http(s) 地址，(blockId, 地址) 必须成对出现在白名单里；仍经 Notion /image/ 取图，
 *   沿用它绕 Referer 防盗链的效果，Function 自己不直连外站
 * - 白名单 /img-allowlist.json 由 scripts/img-allowlist.mjs 构建时扫 out/ 得到，
 *   别人的 Notion 公开页面或任意外链即便拼出合法地址也拿不到
 * - 缓存键只用 table + blockId + 原图键（Notion 文件去掉签名参数，外链用完整地址），签名过期换新不影响命中
 * - 上游失败返回 502，不缓存
 */
import {
  allowlistKey,
  isProxyTable,
  isUuid,
  normalizeUuid,
  proxySourceKey
} from '../../lib/db/notion/imgProxy.js'

const NOTION_IMAGE_ORIGIN = 'https://www.notion.so/image/'
const ALLOWLIST_PATH = '/img-allowlist.json'
const CACHE_CONTROL = 'public, max-age=31536000, immutable'

const plain = (status, body, extra = {}) =>
  new Response(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...extra }
  })

// 同一个 isolate 内复用白名单；拉取失败不留缓存，下次重试
let allowlistPromise = null
const loadAllowlist = (env, requestUrl) => {
  if (!allowlistPromise) {
    allowlistPromise = env.ASSETS.fetch(new URL(ALLOWLIST_PATH, requestUrl))
      .then(res =>
        res.ok ? res.json() : Promise.reject(new Error(String(res.status)))
      )
      .then(list => new Set(Array.isArray(list) ? list : []))
      .catch(err => {
        allowlistPromise = null
        throw err
      })
  }
  return allowlistPromise
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return plain(405, 'Method not allowed', { Allow: 'GET, HEAD' })
  }

  const url = new URL(request.url)
  const [, prefix, table, rawId, ...rest] = url.pathname.split('/')
  const src = url.searchParams.get('src') || ''
  const sourceKey = proxySourceKey(src)
  if (
    prefix !== 'img' ||
    rest.length ||
    !isProxyTable(table) ||
    !isUuid(rawId) ||
    !sourceKey
  ) {
    return plain(403, 'Forbidden')
  }
  const blockId = normalizeUuid(rawId)

  // 先查白名单再查缓存：缓存一年有效，不能让下线的图靠旧缓存继续可取
  let allowlist
  try {
    allowlist = await loadAllowlist(env, request.url)
  } catch {
    return plain(502, 'Allowlist unavailable')
  }
  if (!allowlist.has(allowlistKey(blockId, src))) return plain(403, 'Forbidden')

  const cache = caches.default
  const cacheKey = new Request(
    `${url.origin}/img/${table}/${blockId}?k=${encodeURIComponent(sourceKey)}`,
    { method: 'GET' }
  )
  const cached = await cache.match(cacheKey)
  if (cached) {
    const headers = new Headers(cached.headers)
    headers.set('X-Img-Proxy-Cache', 'HIT')
    return new Response(request.method === 'HEAD' ? null : cached.body, {
      status: cached.status,
      headers
    })
  }

  const upstream = `${NOTION_IMAGE_ORIGIN}${encodeURIComponent(src)}?table=${table}&id=${blockId}&cache=v2`
  let response = null
  try {
    response = await fetch(upstream, {
      headers: { Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }
    })
  } catch {}
  const contentType = response?.headers.get('content-type') || ''
  if (!response || !response.ok || !contentType.startsWith('image/')) {
    return plain(502, 'Bad gateway', {
      'X-Upstream-Status': String(response ? response.status : 'error')
    })
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': CACHE_CONTROL,
    'X-Content-Type-Options': 'nosniff',
    // 站点图标等可能是 SVG，同源直接打开时禁止其中脚本执行
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    'X-Img-Proxy-Cache': 'MISS'
  })
  for (const name of ['content-length', 'etag', 'last-modified']) {
    const value = response.headers.get(name)
    if (value) headers.set(name, value)
  }
  const proxied = new Response(response.body, { status: 200, headers })
  context.waitUntil(cache.put(cacheKey, proxied.clone()))
  return request.method === 'HEAD'
    ? new Response(null, { status: 200, headers })
    : proxied
}
