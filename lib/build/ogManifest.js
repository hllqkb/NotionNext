import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { normalizeSiteUrl } from '@/lib/sitemap-utils'
import READING_CONFIG from '@/themes/reading/config'
import fs from 'fs'

// scripts/og-images.mjs 在 next build 之后读这份清单画分享图
export const OG_MANIFEST_FILE = './.next/og-posts.json'

/**
 * 把每篇文章画图要用的字段写成清单。所有有页面的文章都要有图（含 Invisible 和加密文章，只用标题），
 * 和 components/SEO.js 里 og:image 指向 /og/<slug>.png 的范围一致
 * @param {object} props getStaticProps 拿到的全站数据
 */
export function writeOgManifest({ siteInfo, allPages, NOTION_CONFIG } = {}) {
  const author = NOTION_CONFIG?.AUTHOR || BLOG.AUTHOR
  const manifest = {
    site: {
      title: siteInfo?.title || '',
      author,
      seal:
        siteConfig('READING_SEAL', READING_CONFIG.READING_SEAL, NOTION_CONFIG) ||
        author,
      host: hostOf(siteInfo?.link || BLOG.LINK)
    },
    posts: (allPages || [])
      .filter(p => p?.type === 'Post' && p?.slug)
      .map(p => ({
        slug: String(p.slug).replace(/^\/+|\/+$/g, ''),
        title: p.title || '',
        category: (Array.isArray(p.category) ? p.category[0] : p.category) || '',
        publishDate: p.publishDate || null
      }))
  }
  try {
    fs.writeFileSync(OG_MANIFEST_FILE, JSON.stringify(manifest))
    console.log(`[OG] 写入分享图清单 ${manifest.posts.length} 篇`)
  } catch (error) {
    console.warn('[OG] 无法写入分享图清单', error)
  }
}

const hostOf = link => {
  try {
    return new URL(normalizeSiteUrl(link)).host
  } catch {
    return ''
  }
}
