import { getTextContent } from 'notion-utils'
import { sha256Digest } from '@/lib/utils/password'
import READING_CONFIG from '@/themes/reading/config'
import { normalizePageBlock } from './normalizeUtil'

// 手机上只写标题和正文时，博客数据库里这些属性留空，在这里补默认值
const SUMMARY_LENGTH = 120
// 摘要只看正文开头这几个块，够凑满 120 字，也不用把整篇拉下来
const SUMMARY_BLOCK_COUNT = 8
const SUMMARY_BLOCK_TYPES = [
  'text',
  'header',
  'sub_header',
  'sub_sub_header',
  'quote',
  'callout',
  'bulleted_list',
  'numbered_list',
  'to_do',
  'toggle'
]

/**
 * 博客数据库里的行：type 空当 Post；Post 的 slug、category 空时补默认值
 * slug 用页面 id 的哈希，标题以后怎么改链接都不变
 */
export function applyPostDefaults(properties) {
  if (!properties.type) properties.type = 'Post'
  if (properties.type !== 'Post') return properties
  if (!properties.slug) {
    const id = String(properties.id).replace(/-/g, '').toLowerCase()
    properties.slug = `p-${sha256Digest(id).slice(0, 8)}`
  }
  if (!properties.category) {
    properties.category = READING_CONFIG.READING_DEFAULT_CATEGORY
  }
  return properties
}

/**
 * 已发布、没写 summary 的 Post 从正文开头截取摘要；加密文章不截，免得正文漏到列表和 RSS
 */
export async function fillSummaryFromContent(posts, block, fetchBlocks) {
  const targets = posts.filter(
    p =>
      p.type === 'Post' &&
      p.status === 'Published' &&
      !p.summary &&
      !p.password
  )
  if (targets.length === 0) return

  const childIds = new Map()
  for (const post of targets) {
    const content = normalizePageBlock(block[post.id])?.content
    if (Array.isArray(content)) {
      childIds.set(post.id, content.slice(0, SUMMARY_BLOCK_COUNT))
    }
  }
  const missing = [...childIds.values()].flat().filter(id => !normalizePageBlock(block[id]))
  const fetched = missing.length > 0 ? await fetchBlocks(missing) : {}

  for (const post of targets) {
    const parts = []
    for (const id of childIds.get(post.id) || []) {
      const child = normalizePageBlock(block[id] || fetched[id])
      if (!SUMMARY_BLOCK_TYPES.includes(child?.type)) continue
      const text = getTextContent(child.properties?.title).trim()
      if (text) parts.push(text)
    }
    const text = parts.join(' ').replace(/\s+/g, ' ')
    if (!text) continue
    post.summary =
      text.length > SUMMARY_LENGTH ? `${text.slice(0, SUMMARY_LENGTH)}…` : text
  }
}
