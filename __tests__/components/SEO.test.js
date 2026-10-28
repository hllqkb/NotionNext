import { render } from '@testing-library/react'
import SEO, { generateStructuredData } from '@/components/SEO'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn()
}))

jest.mock('@/lib/global', () => ({
  useGlobal: () => ({
    locale: {
      NAV: { ARCHIVE: 'Archive', SEARCH: 'Search', PAGE_NOT_FOUND: 'Not Found' },
      COMMON: { CATEGORY: 'Category', TAGS: 'Tags' }
    }
  })
}))

const { siteConfig } = require('@/lib/config')

const baseSiteConfig = {
  AUTHOR: 'Example Author',
  BACKGROUND_DARK: '#ffffff',
  BLOG_FAVICON: '/favicon.ico',
  ENABLE_RSS: true,
  FONT_URL: '',
  KEYWORDS: 'notion,next',
  LANG: 'en-US',
  LINK: 'https://example.com',
  PATH: '',
  SUB_PATH: '',
  TITLE: 'Example Blog'
}

const renderSeo = fontUrl => {
  siteConfig.mockImplementation((key, defaultVal) => {
    if (key === 'FONT_URL') return fontUrl
    return Object.prototype.hasOwnProperty.call(baseSiteConfig, key)
      ? baseSiteConfig[key]
      : defaultVal
  })

  return render(
    <SEO
      siteInfo={{
        title: 'Example Blog',
        description: 'Example description',
        icon: '/logo.png',
        pageCover: '/cover.png',
        link: 'https://example.com'
      }}
    />
  )
}

describe('SEO structured data', () => {
  const siteInfo = {
    title: 'Example Blog',
    description: 'Example description',
    icon: '/logo.png'
  }

  it('generates BlogPosting data for published articles', () => {
    const data = generateStructuredData(
      {
        type: 'Post',
        title: 'Structured data in NotionNext',
        description: 'A test article',
        publishTime: '2026-07-01T00:00:00.000Z',
        modifiedTime: '2026-07-02T00:00:00.000Z',
        tags: ['notion', 'seo'],
        category: 'Engineering'
      },
      siteInfo,
      'https://example.com/article/structured-data',
      'https://example.com/cover.png',
      'Example Author',
      'https://example.com'
    )

    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Structured data in NotionNext',
      url: 'https://example.com/article/structured-data',
      datePublished: '2026-07-01T00:00:00.000Z',
      dateModified: '2026-07-02T00:00:00.000Z',
      keywords: 'notion, seo',
      articleSection: 'Engineering',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://example.com/article/structured-data'
      }
    })
    expect(data.publisher.logo.url).toBe('https://example.com/logo.png')
  })

  it('generates WebSite data for non-article pages', () => {
    const data = generateStructuredData(
      { type: 'Page' },
      siteInfo,
      'https://example.com/about',
      'https://example.com/cover.png',
      'Example Author',
      'https://example.com'
    )

    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Example Blog',
      url: 'https://example.com'
    })
  })
})

describe('SEO RSS discovery', () => {
  it('exposes an RSS alternate link for readers and browsers', () => {
    const { container } = renderSeo('')
    const rssLink = container.querySelector(
      'link[rel="alternate"][type="application/rss+xml"]'
    )

    expect(rssLink).toBeInTheDocument()
    expect(rssLink.getAttribute('href')).toBe(
      'https://example.com/rss/feed.xml'
    )
  })

  it('omits the alternate link when RSS is disabled', () => {
    siteConfig.mockImplementation((key, defaultVal) => {
      if (key === 'ENABLE_RSS') return false
      return Object.prototype.hasOwnProperty.call(baseSiteConfig, key)
        ? baseSiteConfig[key]
        : defaultVal
    })

    const { container } = render(
      <SEO
        siteInfo={{
          title: 'Example Blog',
          description: 'Example description',
          link: 'https://example.com'
        }}
      />
    )

    expect(
      container.querySelector('link[type="application/rss+xml"]')
    ).not.toBeInTheDocument()
  })
})

describe('SEO share image and canonical', () => {
  const router = require('next/router')

  const renderWith = (config, props, route = '/') => {
    siteConfig.mockImplementation((key, defaultVal) => {
      if (Object.prototype.hasOwnProperty.call(config, key)) return config[key]
      return Object.prototype.hasOwnProperty.call(baseSiteConfig, key)
        ? baseSiteConfig[key]
        : defaultVal
    })
    jest
      .spyOn(router, 'useRouter')
      .mockReturnValue({ route, pathname: route, query: {}, asPath: route })
    return render(
      <SEO
        siteInfo={{
          title: 'Example Blog',
          description: 'Example description',
          pageCover: 'https://www.notion.so/images/page-cover/nasa.jpg',
          link: 'https://example.com'
        }}
        {...props}
      />
    )
  }
  const attr = (container, selector, name) =>
    container.querySelector(selector)?.getAttribute(name)

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uses the site default share image instead of the Notion cover', () => {
    const { container } = renderWith({ SEO_OG_IMAGE: '/og-default.png' })
    expect(attr(container, 'meta[property="og:image"]', 'content')).toBe(
      'https://example.com/og-default.png'
    )
    expect(attr(container, 'link[rel="canonical"]', 'href')).toBe(
      'https://example.com'
    )
  })

  it('falls back to the Notion cover when no default image is set', () => {
    const { container } = renderWith({ SEO_OG_IMAGE: '' })
    expect(attr(container, 'meta[property="og:image"]', 'content')).toBe(
      'https://www.notion.so/images/page-cover/nasa.jpg'
    )
  })

  const post = {
    type: 'Post',
    title: 'Hello',
    slug: 'article/hello',
    summary: 'sum',
    ext: {}
  }

  it('keeps the article cover and self canonical for posts', () => {
    const { container } = renderWith(
      { SEO_OG_IMAGE: '/og-default.png' },
      { post: { ...post, pageCoverThumbnail: 'https://example.com/c.png' } },
      '/[prefix]/[slug]'
    )
    expect(attr(container, 'meta[property="og:image"]', 'content')).toBe(
      'https://example.com/c.png'
    )
    expect(attr(container, 'link[rel="canonical"]', 'href')).toBe(
      'https://example.com/article/hello'
    )
  })

  it('uses the default image for posts without a cover', () => {
    const { container } = renderWith(
      { SEO_OG_IMAGE: '/og-default.png' },
      { post: { ...post, pageCoverThumbnail: '' } },
      '/[prefix]/[slug]'
    )
    expect(attr(container, 'meta[property="og:image"]', 'content')).toBe(
      'https://example.com/og-default.png'
    )
  })

  it('honours an absolute canonicalUrl from ext and ignores a relative one', () => {
    const { container } = renderWith(
      {},
      { post: { ...post, ext: { canonicalUrl: 'https://origin.example/a' } } },
      '/[prefix]/[slug]'
    )
    expect(attr(container, 'link[rel="canonical"]', 'href')).toBe(
      'https://origin.example/a'
    )
    expect(attr(container, 'meta[property="og:url"]', 'content')).toBe(
      'https://example.com/article/hello'
    )

    const relative = renderWith(
      {},
      { post: { ...post, ext: { canonicalUrl: '/elsewhere' } } },
      '/[prefix]/[slug]'
    )
    expect(attr(relative.container, 'link[rel="canonical"]', 'href')).toBe(
      'https://example.com/article/hello'
    )
  })

  it('omits canonical on the 404 page', () => {
    const { container } = renderWith({}, {}, '/404')
    expect(container.querySelector('link[rel="canonical"]')).toBeNull()
  })
})

describe('SEO font resource hints', () => {
  it('omits Google Fonts hints for non-Google font URLs', () => {
    const { container } = renderSeo(
      'https://npm.elemecdn.com/lxgw-wenkai-webfont@1.6.0/style.css'
    )

    expect(
      container.querySelector('link[href="//fonts.googleapis.com"]')
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('link[href="https://fonts.gstatic.com"]')
    ).not.toBeInTheDocument()
  })

  it('emits Google Fonts hints for Google font URLs', () => {
    const { container } = renderSeo([
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'
    ])

    expect(
      container.querySelector('link[href="//fonts.googleapis.com"]')
    ).toBeInTheDocument()
    expect(
      container.querySelector('link[href="https://fonts.gstatic.com"]')
    ).toBeInTheDocument()
  })
})

describe('font config defaults', () => {
  const originalFontUrl = process.env.NEXT_PUBLIC_FONT_URL

  afterEach(() => {
    jest.resetModules()
    if (originalFontUrl === undefined) {
      delete process.env.NEXT_PUBLIC_FONT_URL
    } else {
      process.env.NEXT_PUBLIC_FONT_URL = originalFontUrl
    }
  })

  it('does not load large Chinese Google Fonts by default', () => {
    delete process.env.NEXT_PUBLIC_FONT_URL
    jest.resetModules()

    const fontConfig = require('@/conf/font.config')
    const defaultFontUrls = Array.isArray(fontConfig.FONT_URL)
      ? fontConfig.FONT_URL
      : [fontConfig.FONT_URL]

    expect(defaultFontUrls).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining('Noto+Sans+SC'),
        expect.stringContaining('Noto+Serif+SC')
      ])
    )
  })

  it('keeps NEXT_PUBLIC_FONT_URL opt-in support', () => {
    process.env.NEXT_PUBLIC_FONT_URL =
      'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&display=swap'
    jest.resetModules()

    const fontConfig = require('@/conf/font.config')

    expect(fontConfig.FONT_URL).toBe(process.env.NEXT_PUBLIC_FONT_URL)
  })
})
