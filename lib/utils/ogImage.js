/**
 * 文章分享图的站内路径，与 scripts/og-images.mjs 的输出位置保持一致：out/og/<slug>.png
 * 图片在 yarn export 的最后一步生成，dev 模式下没有这些文件
 * @param {string} slug 文章 slug，可能带 article/ 之类的前缀
 * @returns {string} 以 / 开头的路径；slug 为空时返回空串
 */
export function getPostOgImagePath(slug) {
  const clean = String(slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
  if (!clean) return ''
  return `/og/${clean.split('/').map(encodeURIComponent).join('/')}.png`
}
