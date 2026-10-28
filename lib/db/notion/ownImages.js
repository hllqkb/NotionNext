import BLOG from '@/blog.config'
import OWN_IMAGES from './ownImages.json'

// 与 scripts/build-webp-images.py 的 WIDTHS 保持一致
const WEBP_WIDTHS = [480, 960, 1440]

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
 * @returns {{original: string, webp: string|null, srcSet: string|null, width: number, height: number}|null}
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

  const [width, height, hasWebp = 1] = entry
  if (!hasWebp) return { original: path, webp: null, srcSet: null, width, height }

  const base = path.replace(/\.[^.]+$/, '')
  const srcSet = WEBP_WIDTHS.filter(w => w < width)
    .map(w => `${base}-${w}.webp ${w}w`)
    .concat(`${base}.webp ${width}w`)
    .join(', ')
  return { original: path, webp: `${base}.webp`, srcSet, width, height }
}
