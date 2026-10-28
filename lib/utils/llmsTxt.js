import BLOG from '@/blog.config'
import { createSiteUrl, normalizeSiteUrl } from '@/lib/sitemap-utils'
import fs from 'fs'

/**
 * 按 https://llmstxt.org/ 的格式生成站点索引：简介 + 文章列表（标题、链接、摘要），按发布时间倒序。
 * 只列已发布的文章；加密文章只给标题和链接，不带摘要，避免正文从这里漏出去。
 * 定时文章在 SiteDataApi 里已经剔除，这里拿到的 allPages 不含未到期的文章。
 * @param {object} props getStaticProps 拿到的全站数据
 * @returns {string}
 */
export function buildLlmsTxt({ siteInfo, allPages, NOTION_CONFIG } = {}) {
  const link = normalizeSiteUrl(siteInfo?.link || BLOG.LINK)
  const title = siteInfo?.title || BLOG.TITLE
  const description = oneLine(siteInfo?.description)
  const author = NOTION_CONFIG?.AUTHOR || BLOG.AUTHOR
  const bio = oneLine(NOTION_CONFIG?.BIO || BLOG.BIO)

  const posts = (allPages || [])
    .filter(p => p?.type === 'Post' && p?.status === 'Published' && p?.slug)
    .sort((a, b) => (b?.publishDate || 0) - (a?.publishDate || 0))

  const lines = [`# ${title}`, '']
  if (description) lines.push(`> ${description}`, '')
  if (bio) lines.push(`作者：${author}，${bio}`, '')
  lines.push(
    `${author} 的个人博客，共 ${posts.length} 篇文章，下面按发布时间倒序列出。`,
    '',
    `- 订阅：${createSiteUrl(link, 'rss/feed.xml')}`,
    `- 站点地图：${createSiteUrl(link, 'sitemap.xml')}`,
    '',
    '## 文章',
    ''
  )
  for (const post of posts) {
    const url = createSiteUrl(link, post.slug)
    const summary = post.password ? '加密文章，正文需要密码' : oneLine(post.summary)
    const notes = [post.publishDay, summary].filter(Boolean).join('，')
    lines.push(`- [${oneLine(post.title)}](${url})${notes ? `: ${notes}` : ''}`)
  }
  return `${lines.join('\n')}\n`
}

/**
 * 写到 public/llms.txt，随静态导出一起发布
 * @param {object} props
 */
export function generateLlmsTxt(props) {
  try {
    fs.writeFileSync('./public/llms.txt', buildLlmsTxt(props))
    console.log('[llms.txt] 生成 /llms.txt')
  } catch (error) {
    console.warn('[llms.txt] 无法写入文件', error)
  }
}

const oneLine = text =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
