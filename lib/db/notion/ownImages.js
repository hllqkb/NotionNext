import BLOG from '@/blog.config'
import OWN_IMAGES from './ownImages.json'

// 与 scripts/build-webp-images.py 的 WIDTHS 保持一致
const WEBP_WIDTHS = [240, 480, 960, 1440]
// 列表缩略图（显示 44–64px，3 倍屏约 190px）用的尺寸
const THUMB_WIDTH = 240
// 外链图下载到本站的副本：public/images/mirror/<原域名>/<原路径>
const MIRROR_DIR = '/images/mirror/'

const OWN_SITE_HOST = (() => {
  try {
    return new URL(BLOG.LINK).host
  } catch {
    return ''
  }
})()

/**
 * 本站托管图片（public/images/wechat、csdn）的 WebP 多尺寸地址与宽高
 * 清单由 scripts/build-webp-images.py 生成；不在清单里的图片返回 null，照原样渲染
 *
 * 返回同源相对路径：预览部署、正式域名都从当前站点取图
 * @param {string} src 图片地址，绝对（本站域名）或 /images/ 开头的相对路径
 * @returns {{original: string, webp: string|null, srcSet: string|null, thumb?: string|null, width: number, height: number}|null}
 */
export const ownImageSources = src => {
  if (!src || typeof src !== 'string') return null
  let url
  try {
    url = new URL(src, 'http://relative.invalid')
  } catch {
    return null
  }
  const isRelative = url.host === 'relative.invalid'
  if (!isRelative && url.host !== OWN_SITE_HOST) return null

  let path
  try {
    path = decodeURIComponent(url.pathname)
  } catch {
    return null
  }
  const entry = OWN_IMAGES[path]
  if (!entry) return null

  const [width, height, hasWebp = 1, hasThumb = 0] = entry
  const base = path.replace(/\.[^.]+$/, '')
  if (!hasWebp) {
    // 原尺寸 WebP 不比原图小时只留了缩略图（scripts/build-webp-images.py）
    const thumb = hasThumb ? `${base}-${THUMB_WIDTH}.webp` : null
    return { original: path, webp: null, srcSet: null, thumb, width, height }
  }

  const srcSet = WEBP_WIDTHS.filter(w => w < width)
    .map(w => `${base}-${w}.webp ${w}w`)
    .concat(`${base}.webp ${width}w`)
    .join(', ')
  return { original: path, webp: `${base}.webp`, srcSet, width, height }
}

/**
 * 外链图在本站有副本时（public/images/mirror/<原域名>/<原路径>，在清单里）返回本站绝对地址，否则 null
 * 绝对地址与 Notion 里直接填本站图片的封面一致，og:image 等场景可直接使用
 * @param {string} src 外链图片地址
 * @returns {string|null}
 */
export const mirroredOwnUrl = src => {
  if (!src || typeof src !== 'string' || !/^https?:\/\//i.test(src)) return null
  let url
  let path
  try {
    url = new URL(src)
    path = `${MIRROR_DIR}${url.host}${decodeURIComponent(url.pathname)}`
  } catch {
    return null
  }
  if (!OWN_IMAGES[path]) return null
  return `${BLOG.LINK.replace(/\/$/, '')}${MIRROR_DIR}${url.host}${url.pathname}`
}

/**
 * 列表缩略图：本站图取 240 宽 WebP（原图更窄时用原尺寸 WebP），宽高按所取尺寸给出
 * 不在清单里的图片返回 null，调用方照原样渲染
 * @param {string} src
 * @returns {{src: string, width: number, height: number}|null}
 */
export const ownThumbnail = src => {
  const own = ownImageSources(src)
  if (!own) return null
  const { width, height } = own
  if (!own.webp && !own.thumb) return { src: own.original, width, height }
  if (own.webp && width <= THUMB_WIDTH) return { src: own.webp, width, height }
  return {
    src: own.thumb || own.webp.replace(/\.webp$/, `-${THUMB_WIDTH}.webp`),
    width: THUMB_WIDTH,
    height: Math.round((height * THUMB_WIDTH) / width)
  }
}
