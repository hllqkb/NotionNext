import fs from 'fs'
import { generateRss, shouldGenerateRssForLocale } from '@/lib/utils/rss'
import { getFeedPosts } from '@/lib/utils/feedPosts'
import { getPostBlocks } from '@/lib/db/SiteDataApi'
import { formatNotionBlock } from '@/lib/db/notion/getPostBlocks'
import { adapterNotionBlockMap } from '@/lib/utils/notion.util'

const addItemMock = jest.fn()
const rss2Mock = jest.fn(() => '<rss>ok</rss>')
const atom1Mock = jest.fn(() => '<atom>ok</atom>')
const json1Mock = jest.fn(() => '{"ok":true}')

jest.mock('feed', () => ({
  Feed: jest.fn().mockImplementation(() => ({
    addItem: addItemMock,
    rss2: rss2Mock,
    atom1: atom1Mock,
    json1: json1Mock
  }))
}))

jest.mock('react-dom/server', () => ({
  __esModule: true,
  default: {
    renderToString: jest.fn(() => '<div>rss-content</div>')
  }
}))

jest.mock('@/components/NotionPage', () => ({
  __esModule: true,
  default: () => null
}))

jest.mock('@/lib/db/SiteDataApi', () => ({
  getPostBlocks: jest.fn()
}))

jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  formatNotionBlock: jest.fn(block => block)
}))

jest.mock('@/lib/utils/notion.util', () => ({
  adapterNotionBlockMap: jest.fn(blockMap => blockMap)
}))

describe('generateRss', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(fs, 'statSync').mockImplementation(() => {
      throw new Error('ENOENT')
    })
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {})
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('adapts and formats blockMap before rendering RSS content', async () => {
    const rawBlockMap = {
      block: {
        x1: { id: 'x1', type: 'text' }
      }
    }
    const adaptedBlockMap = {
      block: {
        y1: { id: 'y1', type: 'text' }
      }
    }
    const formattedBlock = {
      y1: { id: 'y1', type: 'text', properties: {} }
    }

    getPostBlocks.mockResolvedValue(rawBlockMap)
    adapterNotionBlockMap.mockReturnValue(adaptedBlockMap)
    formatNotionBlock.mockReturnValue(formattedBlock)

    await generateRss({
      NOTION_CONFIG: {
        AUTHOR: 'author',
        LANG: 'zh-CN',
        SUB_PATH: '',
        CONTACT_EMAIL: ''
      },
      siteInfo: {
        title: 'site',
        description: 'desc',
        link: 'https://example.com'
      },
      allPages: [
        {
          id: 'post-1',
          type: 'Post',
          status: 'Published',
          slug: 'hello',
          title: 'Hello',
          summary: 'Summary',
          publishDay: '2026-02-18'
        }
      ]
    })

    expect(getPostBlocks).toHaveBeenCalledWith('post-1', 'rss-content')
    expect(adapterNotionBlockMap).toHaveBeenCalledWith(rawBlockMap)
    expect(formatNotionBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        y1: expect.objectContaining({ id: 'y1', type: 'text' })
      })
    )
    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '<div>rss-content</div>'
      })
    )
    expect(fs.writeFileSync).toHaveBeenCalledTimes(3)
  })

  it('uses summary without fetching blocks when RSS_FULL_CONTENT is disabled', async () => {
    await generateRss({
      NOTION_CONFIG: {
        AUTHOR: 'author',
        LANG: 'zh-CN',
        SUB_PATH: '',
        CONTACT_EMAIL: '',
        RSS_FULL_CONTENT: 'false'
      },
      siteInfo: {
        title: 'site',
        description: 'desc',
        link: 'https://example.com'
      },
      allPages: [
        {
          id: 'post-1',
          type: 'Post',
          status: 'Published',
          slug: 'hello',
          title: 'Hello',
          summary: 'Summary',
          publishDay: '2026-08-25'
        }
      ]
    })

    expect(getPostBlocks).not.toHaveBeenCalled()
    expect(adapterNotionBlockMap).not.toHaveBeenCalled()
    expect(formatNotionBlock).not.toHaveBeenCalled()
    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Summary',
        content: 'Summary'
      })
    )
    expect(fs.writeFileSync).toHaveBeenCalledTimes(3)
  })

  it('feeds the newest published posts, not the most recently edited', async () => {
    await generateRss({
      NOTION_CONFIG: { RSS_FULL_CONTENT: 'false' },
      siteInfo: { title: 'site', link: 'https://example.com' },
      allPages: [
        {
          id: 'old',
          slug: 'old',
          title: 'Old but edited',
          type: 'Post',
          status: 'Published',
          publishDate: Date.parse('2025-08-21'),
          lastEditedDate: new Date('2026-10-20')
        },
        {
          id: 'new',
          slug: 'new',
          title: 'New',
          type: 'Post',
          status: 'Published',
          publishDate: Date.parse('2026-07-29'),
          lastEditedDate: new Date('2026-07-29')
        },
        {
          id: 'page',
          slug: 'about',
          title: 'About',
          type: 'Page',
          status: 'Published',
          publishDate: Date.parse('2026-10-01')
        }
      ]
    })

    expect(addItemMock.mock.calls.map(([item]) => item.title)).toEqual([
      'New',
      'Old but edited'
    ])
  })

  it('caps the feed at the requested count', () => {
    const pages = Array.from({ length: 30 }, (_, i) => ({
      id: `p${i}`,
      type: 'Post',
      status: 'Published',
      publishDate: i
    }))
    const feedPosts = getFeedPosts(pages, 20)
    expect(feedPosts).toHaveLength(20)
    expect(feedPosts[0].id).toBe('p29')
  })

  it('generates RSS only for the default locale during multi-locale builds', () => {
    expect(shouldGenerateRssForLocale({ locale: undefined })).toBe(true)
    expect(
      shouldGenerateRssForLocale({ locale: 'zh-CN', defaultLocale: 'zh-CN' })
    ).toBe(true)
    expect(
      shouldGenerateRssForLocale({ locale: 'en', defaultLocale: 'zh-CN' })
    ).toBe(false)
  })
})
