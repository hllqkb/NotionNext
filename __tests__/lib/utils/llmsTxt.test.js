import { buildLlmsTxt } from '@/lib/utils/llmsTxt'

jest.mock('@/blog.config', () => ({
  LINK: 'https://fallback.example',
  AUTHOR: 'Example Author',
  BIO: 'Writes things.'
}))

const siteInfo = {
  title: 'Example Blog',
  description: 'Notes on\nsoftware',
  link: 'https://example.com/'
}

const allPages = [
  { type: 'Post', status: 'Published', slug: 'article/old', title: 'Old', summary: 'old summary', publishDate: 1, publishDay: '2020-1-1' },
  { type: 'Post', status: 'Published', slug: 'article/new', title: 'New', summary: 'new summary', publishDate: 3, publishDay: '2026-1-1' },
  { type: 'Post', status: 'Published', slug: 'article/locked', title: 'Locked', summary: 'secret words', password: 'protected', publishDate: 2 },
  { type: 'Post', status: 'Invisible', slug: 'article/hidden', title: 'Hidden', publishDate: 4 },
  { type: 'Page', status: 'Published', slug: 'about', title: 'About', publishDate: 5 }
]

describe('buildLlmsTxt', () => {
  const text = buildLlmsTxt({ siteInfo, allPages, NOTION_CONFIG: {} })

  it('starts with the site title and a one-line description', () => {
    expect(text.startsWith('# Example Blog\n\n> Notes on software\n')).toBe(true)
    expect(text).toContain('https://example.com/rss/feed.xml')
  })

  it('lists published posts newest first with absolute links', () => {
    const items = text.split('\n').filter(line => line.startsWith('- ['))
    expect(items).toEqual([
      '- [New](https://example.com/article/new): 2026-1-1，new summary',
      '- [Locked](https://example.com/article/locked): 加密文章，正文需要密码',
      '- [Old](https://example.com/article/old): 2020-1-1，old summary'
    ])
  })

  it('leaves out hidden pages, non-posts and encrypted summaries', () => {
    expect(text).not.toContain('Hidden')
    expect(text).not.toContain('About')
    expect(text).not.toContain('secret words')
  })
})
