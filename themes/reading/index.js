'use client'

import { ownImageSources } from '@/lib/db/notion/ownImages'
import dynamic from 'next/dynamic'
import { siteConfig } from '@/lib/config'
import { scrollBehavior } from '@/lib/readingPreferences'
import { isBrowser } from '@/lib/utils'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { CategoryChips, LockIcon, Masthead, PageLink, SiteFooter, WritingStreak, YearGroups, filterByCategory, hasCover, postDay, useReveal } from './components/Frame'
import Gallery, { galleryImages } from './components/Gallery'
import { LayoutAbout, LayoutBooks, LayoutGallery, LayoutLinks, LayoutProjects, pageLayoutFor } from './components/Pages'
import { SkillsBoard } from './components/Skills'
import { SubscribePage } from './components/Subscribe'
import { RandomPost, ReadingPicks, RecentlyUpdated, wholeSentences } from './components/Home'

const Comment = dynamic(() => import('@/components/Comment'), { ssr: false })
// 正文组件动态引入（SSR 照常输出），它带的 Notion/KaTeX 样式就只进文章页，不进全站 CSS。
// 客户端跳转或解锁时分包可能晚到，挂载后回调 onMount，正文相关的 DOM 增强等它再初始化
const NotionPage = dynamic(() =>
  import('@/components/NotionPage').then(m => {
    const Body = m.default
    const NotionBody = ({ onMount, ...props }) => {
      useEffect(() => {
        onMount?.()
      }, [])
      return <Body {...props} />
    }
    return NotionBody
  })
)
import Toc, { useActiveHeading } from './components/Toc'
import BookmarkCord from './components/BookmarkCord'
import { ReadingProgress, RelatedPosts, SeriesBox, dekOf, getRelatedPosts, getSeries } from './components/Article'
import { PageViews, RecentComments, ShareLink, SourceNote, StaleNote, sourceOf, useFootnotes, useImageFallback, useZoomKeyboard } from './components/ArticleTools'
import CONFIG from './config'
import { usePageFont } from './components/PageFont'
import { Style } from './style'

/**
 * 评论区离视口还有一屏时才挂 Comment，连它的分包也不提前下载
 */
const LazyComment = ({ post }) => {
  const ref = useRef(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (show || !ref.current) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) setShow(true)
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [show])
  return <div ref={ref}>{show ? <Comment frontMatter={post} /> : <p className='comments-hint'>评论加载中…</p>}</div>
}

/**
 * 基础框架：文章页自己排版（左目录右正文），其余页面放进 .page 版心
 */
const LayoutBase = props => {
  const { children, siteInfo, post } = props
  const revealReady = useReveal()
  usePageFont()
  // data-prismjs-copy*：Prism copy-to-clipboard 插件从祖先元素读这几个属性作为按钮文案
  return (
    <div
      id='theme-reading'
      className={`${siteConfig('FONT_STYLE')} ${revealReady ? 'reveal-ready' : ''}`}
      data-prismjs-copy='复制'
      data-prismjs-copy-success='已复制'
      data-prismjs-copy-error='按 Ctrl+C 复制'>
      <Style />
      <div className='page'>
        <Masthead siteInfo={siteInfo} />
        {!post && <main id='content'>{children}</main>}
      </div>
      {post && <main id='content'>{children}</main>}
      <SiteFooter siteInfo={siteInfo} />
      <BookmarkCord />
      <script type='speculationrules' dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }} />
    </div>
  )
}

// 站内链接是整页跳转（PageLink 用原生 a）。分类、标签页在悬停或进入视口停留时先取 HTML，点下去不用再等网络；
// 只 prefetch 不 prerender，不支持的浏览器忽略这段
const SPECULATION_RULES = JSON.stringify({
  prefetch: [
    {
      where: { or: ['/category', '/category/*', '/tag', '/tag/*'].map(href_matches => ({ href_matches })) },
      eagerness: 'moderate'
    }
  ]
})

/** 搜索框：原生 GET 表单，回车到 /search?s=关键词，结果页的地址可以直接分享 */
const SearchBox = ({ keyword = '' }) => (
  <form className='search-box' role='search' action='/search' method='get'>
    <label htmlFor='reading-search' className='sr-only'>
      搜索文章
    </label>
    <input
      key={keyword}
      id='reading-search'
      name='s'
      type='search'
      placeholder='搜索标题、标签或正文'
      defaultValue={keyword}
    />
  </form>
)

// 最近一篇的封面：桌面是 240px 小图，窄屏占满版心；本站图用多尺寸 WebP，其余图片照原地址
const LEAD_COVER_SIZES = '(min-width: 1000px) 240px, (max-width: 520px) calc(100vw - 40px), (max-width: 800px) calc(100vw - 48px), calc(100vw - 112px)'
const LeadCoverImage = ({ src }) => {
  const own = ownImageSources(src)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={own?.webp || own?.original || src}
      srcSet={own?.srcSet || undefined}
      sizes={own?.srcSet ? LEAD_COVER_SIZES : undefined}
      width={own?.width}
      height={own?.height}
      alt=''
      fetchPriority='high'
    />
  )
}

/** 最近一篇：先标题和摘要，封面放在后面 */
const LeadStory = ({ post }) => (
  <article className={`lead-story reveal${hasCover(post) ? ' has-cover' : ''}`}>
    <div className='lead-meta'>
      <span>最近一篇</span>
      <time dateTime={postDay(post)}>{String(postDay(post)).replaceAll('-', '.')}</time>
      {post.category && <span>{post.category}</span>}
    </div>
    <h2>
      <PageLink href={post.href}>
        {post.password && <LockIcon />}
        {post.title}
      </PageLink>
    </h2>
    <div className='lead-row'>
      <p>{wholeSentences(post.summary)}</p>
      <PageLink className='read-link' href={post.href} aria-label={`阅读：${post.title}`}>
        阅读全文
      </PageLink>
    </div>
    {hasCover(post) && (
      <PageLink href={post.href} className='lead-cover' tabIndex={-1} aria-hidden='true'>
        <LeadCoverImage src={post.pageCoverThumbnail} />
      </PageLink>
    )}
  </article>
)

/** 首页：大标题 + 最近一篇 + 按年归档 */
const LayoutIndex = props => {
  const { postCount } = props
  // 首页直接按发布时间排全部文章（allNavPages 含全部已发布文章），不受 Notion 里的行顺序和分页影响
  const posts = [...(props.allNavPages?.length ? props.allNavPages : props.posts || [])].sort(
    (a, b) => (b.publishDate || 0) - (a.publishDate || 0)
  )
  const [cat, setCat] = useState('')
  const [lead, ...rest] = posts
  const listed = cat ? filterByCategory(posts, cat) : rest
  return (
    <>
      <header className='intro'>
        <div>
          <p className='eyebrow'>{siteConfig('READING_EYEBROW', null, CONFIG)}</p>
          <h1>
            {siteConfig('READING_HOME_TITLE', null, CONFIG)}
            <span className='title-period'>。</span>
          </h1>
          <p className='intro-text'>{siteConfig('READING_HOME_INTRO', null, CONFIG)}</p>
        </div>
        <div className='intro-side'>
          <p className='vertical-title'>
            {String(siteConfig('READING_VERTICAL_TITLE', null, CONFIG) || '')
              .split(/\s+/)
              .filter(Boolean)
              .map(line => (
                <span key={line}>{line}</span>
              ))}
          </p>
        </div>
      </header>
      {siteConfig('READING_STREAK', true, CONFIG) && <WritingStreak pages={props.allNavPages || posts} buildTime={props.buildTime} />}
      <div className='collection-bar'>
        <p>
          全部 {postCount || posts.length} 篇
          <RandomPost posts={posts} />
        </p>
        <SearchBox />
      </div>
      <CategoryChips posts={posts} value={cat} onChange={setCat} />
      {lead && !cat && <LeadStory post={lead} />}
      {!cat && <ReadingPicks posts={posts} exclude={lead} />}
      <YearGroups posts={listed} />
      {postCount > posts.length && (
        <div className='pager'>
          <span />
          <PageLink href='/archive'>查看全部文章</PageLink>
        </div>
      )}
    </>
  )
}

/** 列表页：分类 / 标签 / 分页 */
const LayoutPostList = props => {
  const { posts = [], category, tag, page = 1, postCount } = props
  const perPage = siteConfig('POSTS_PER_PAGE') || 12
  const totalPage = Math.ceil((postCount || posts.length) / perPage)
  const base = category ? `/category/${category}` : tag ? `/tag/${encodeURIComponent(tag)}` : ''
  const title = category ? `分类：${category}` : tag ? `标签：${tag}` : '文章'
  return (
    <>
      <header className='list-head'>
        <h1>
          {title}
          <span className='title-period'>。</span>
        </h1>
      </header>
      <YearGroups posts={posts} />
      {totalPage > 1 && (
        <div className='pager'>
          {page > 1 ? <PageLink href={page - 1 === 1 ? base || '/' : `${base}/page/${page - 1}`}>上一页</PageLink> : <span />}
          {page < totalPage ? <PageLink href={`${base}/page/${page + 1}`}>下一页</PageLink> : <span />}
        </div>
      )}
    </>
  )
}

/**
 * 正文命中：只在搜索页、有关键词时才加载 /pagefind/pagefind.js 和分片索引（构建时 pagefind 生成）
 * 本地 dev 没有索引，加载失败就只显示标题匹配
 */
const usePagefind = keyword => {
  const [state, setState] = useState({ status: 'idle', hits: [] })
  useEffect(() => {
    if (!keyword) {
      setState({ status: 'idle', hits: [] })
      return
    }
    let cancelled = false
    setState({ status: 'loading', hits: [] })
    ;(async () => {
      try {
        const pagefind = await import(/* webpackIgnore: true */ '/pagefind/pagefind.js')
        await pagefind.options({ excerptLength: 36 })
        // 中文会被切成词再「任一命中」，「佛顶塔」会搜出只含「塔」的文章：
        // 单个词用引号走短语匹配；多个词（多个引号短语不支持）宽搜后只留正文里每个词都原样出现的
        const terms = keyword.toLowerCase().split(/\s+/).filter(Boolean)
        const query = terms.length === 1 ? `"${keyword.replace(/"/g, '')}"` : keyword
        const search = await pagefind.search(query)
        const data = await Promise.all((search?.results || []).slice(0, 30).map(r => r.data()))
        const hits = data.filter(d => terms.every(t => String(d.content || '').toLowerCase().includes(t)))
        if (!cancelled) setState({ status: 'done', hits })
      } catch {
        if (!cancelled) setState({ status: 'unavailable', hits: [] })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [keyword])
  return state
}

/** /foo.html、/foo/ 和 /foo 视为同一篇 */
const normalizePath = url => {
  let path = String(url || '').split(/[?#]/)[0]
  try {
    path = decodeURIComponent(path)
  } catch {}
  return path.replace(/\.html$/, '').replace(/\/$/, '') || '/'
}

/** 搜索结果：关键词来自 ?s=，标题匹配在 pages/search 里过滤好，正文命中由 Pagefind 补在后面 */
const LayoutSearch = props => {
  const { keyword, posts = [], allPosts = [] } = props
  const { status, hits } = usePagefind(keyword)
  // 只保留已发布文章的命中，标题已经匹配到的不重复列
  const byPath = new Map(allPosts.map(p => [normalizePath(p.href), p]))
  const titled = new Set(posts.map(p => normalizePath(p.href)))
  const bodyHits = hits
    .map(h => ({ hit: h, post: byPath.get(normalizePath(h.url)) }))
    .filter(x => x.post && !titled.has(normalizePath(x.post.href)))
  const total = posts.length + bodyHits.length
  return (
    <>
      <header className='list-head'>
        <h1>
          搜索<span className='title-period'>。</span>
        </h1>
      </header>
      <div className='collection-bar'>
        <p>
          {keyword ? `「${keyword}」共 ${total} 篇${status === 'loading' ? '，正文检索中…' : ''}` : '输入关键词，回车搜索'}
          {keyword && (
            <PageLink className='search-clear' href='/search'>
              清空
            </PageLink>
          )}
        </p>
        <SearchBox keyword={keyword} />
      </div>
      {/* 结果按 ?s= 在客户端填进来，静态 HTML 里这里是空的：先占住一屏，页脚从一开始就在视口外 */}
      <div className='search-results'>
        {keyword && total === 0 && status !== 'loading' && (
          <p className='empty search-empty'>
            没有找到和「{keyword}」相关的文章。{status === 'unavailable' && '正文索引暂时不可用，这次只搜了标题、摘要、分类和标签。'}可以换个词，或者去
            <PageLink href='/archive'>归档</PageLink>、<PageLink href='/tag'>标签</PageLink>里翻翻。
          </p>
        )}
        {keyword && posts.length > 0 && <YearGroups posts={posts} />}
        {keyword && bodyHits.length > 0 && (
          <section className='year-group body-hits' aria-label='正文命中'>
            <h2 className='year-label'>正文</h2>
            <ul>
              {bodyHits.map(({ hit, post }) => (
                <li key={post.id} className='essay-row body-hit'>
                  <PageLink href={post.href}>
                    <span className='body-hit-head'>
                      <h3>{post.title}</h3>
                      <span className='row-meta'>
                        {post.category && <span className='row-cat'>{post.category}</span>}
                        <time dateTime={postDay(post)}>{String(postDay(post)).replaceAll('-', '.')}</time>
                      </span>
                    </span>
                    {/* excerpt 是 Pagefind 从本站静态 HTML 里截的纯文本，只带 <mark> 高亮 */}
                    <p className='body-hit-excerpt' dangerouslySetInnerHTML={{ __html: hit.excerpt }} />
                  </PageLink>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}

/** 归档：全部文章按年；可切到「最近更新」，按最后编辑时间排 */
const LayoutArchive = props => {
  const { posts = [] } = props
  const [cat, setCat] = useState('')
  const [sort, setSort] = useState('published')
  const shown = filterByCategory(posts, cat)
  return (
    <>
      <header className='list-head archive-head'>
        <h1>
          归档<span className='title-period'>。</span>
        </h1>
        <div className='sort-toggle' role='group' aria-label='排序方式'>
          {[
            ['published', '按发布'],
            ['updated', '最近更新']
          ].map(([key, label]) => (
            <button key={key} type='button' className={sort === key ? 'active' : ''} aria-pressed={sort === key} onClick={() => setSort(key)}>
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className='collection-bar'>
        <p>
          全部 {posts.length} 篇
          <RandomPost posts={props.allNavPages?.length ? props.allNavPages : posts} />
        </p>
        <SearchBox />
      </div>
      <CategoryChips posts={posts} value={cat} onChange={setCat} />
      {sort === 'updated' ? <RecentlyUpdated posts={shown} /> : <YearGroups posts={shown} />}
    </>
  )
}

/** 文章页：左侧目录，右侧正文 */
/** 正文字数与阅读时长：按 Notion 块里的文字算，中文约每分钟 400 字 */
const readingStats = post => {
  const blocks = post?.blockMap?.block || {}
  let chars = 0
  for (const x of Object.values(blocks)) {
    const b = x?.value?.value || x?.value
    if (!b || b.type === 'page' || b.type === 'code') continue
    for (const seg of b.properties?.title || []) chars += String(seg[0] || '').replace(/\s/g, '').length
  }
  return { chars, minutes: Math.max(1, Math.round(chars / 400)) }
}

const LayoutSlug = props => {
  const { post, lock, validPassword, relock, unlocking, prev, next, allNavPages } = props
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [rejected, setRejected] = useState(false)
  const [bodyMounted, setBodyMounted] = useState(false)
  // 画廊文章渲染的是同步的 Gallery，不经过动态正文，直接就绪
  const galleryBody = (post?.tags || []).includes(siteConfig('READING_GALLERY_TAG', null, CONFIG))
  const bodyReady = !lock && (galleryBody || bodyMounted)
  const activeHeading = useActiveHeading(bodyReady ? post?.toc : null)
  useFootnotes(bodyReady ? post?.id : null)
  useImageFallback(bodyReady ? post?.id : null)
  useZoomKeyboard(bodyReady ? post?.id : null)

  useEffect(() => {
    if (!post) {
      const wait = (siteConfig('POST_WAITING_TIME_FOR_404') || 8) * 1000
      const timer = setTimeout(() => {
        if (isBrowser && !document.querySelector('#article-wrapper')) router.push('/404')
      }, wait)
      return () => clearTimeout(timer)
    }
  }, [post])

  if (!post) return null
  const day = postDay(post)
  const isGallery = (post.tags || []).includes(siteConfig('READING_GALLERY_TAG', null, CONFIG))
  const stats = readingStats(post)
  const isArticle = post.type === 'Post'
  const pageUrl = `${siteConfig('LINK')}/${post.slug}`
  const dek = dekOf(post)
  const series = isArticle ? getSeries(post, allNavPages) : null
  const related = isArticle && !lock ? getRelatedPosts(post, allNavPages, series) : []
  const path = `/${post.slug}`
  return (
    <div className='reading-shell'>
      <a className='skip-link' href='#article-wrapper'>
        跳到正文
      </a>
      <ReadingProgress ready={bodyReady} />
      <aside className='sidebar' aria-label='阅读导航'>
        <PageLink className='all-articles' href='/'>
          全部文章
        </PageLink>
        {!lock && <Toc toc={post.toc} active={activeHeading} />}
        <div className='sidebar-note'>
          <p>{siteConfig('READING_SIDEBAR_NOTE', null, CONFIG)}</p>
          <span>{siteConfig('AUTHOR')}</span>
        </div>
      </aside>
      <div className='reading-main'>
        <header className='article-head'>
          <p className='kicker'>
            {post.category && <span>{post.category}</span>}
            {post.category && day && <span>·</span>}
            {day && <time dateTime={day}>{String(day).replaceAll('-', '.')}</time>}
          </p>
          <h1 data-pagefind-meta='title'>{post.title}</h1>
          {dek && <p className='dek'>{dek}</p>}
          <div className='byline'>
            {stats.chars > 0 && !lock && (
              <span>
                {stats.chars.toLocaleString()} 字 · 约 {stats.minutes} 分钟
              </span>
            )}
            {isArticle && !lock && siteConfig('READING_PAGEVIEWS', true, CONFIG) && <PageViews path={path} />}
            {post.tags?.length > 0 && (
              <span className='byline-tags'>
                {post.tags.map(t => (
                  <PageLink key={t} href={`/tag/${encodeURIComponent(t)}`}>
                    {t}
                  </PageLink>
                ))}
              </span>
            )}
            {post.password && !lock && relock && (
              <button
                type='button'
                className='post-relock'
                title='这台设备记住了密码，锁上后要重新输入'
                onClick={() => {
                  setPassword('')
                  relock()
                }}>
                锁上
              </button>
            )}
          </div>
          {isArticle && <SourceNote source={sourceOf(post)} />}
          {isArticle && <StaleNote post={post} buildTime={props.buildTime} />}
        </header>
        <SeriesBox series={series} />
        {!lock && <Toc toc={post.toc} active={activeHeading} mobile />}
        {lock ? (
          <form
            className='post-lock'
            onSubmit={async e => {
              e.preventDefault()
              if (!password || unlocking) return
              setRejected(false)
              setRejected(!(await validPassword(password)))
            }}>
            <label htmlFor='post-lock-password'>这篇文章需要密码。</label>
            <div>
              <input
                id='post-lock-password'
                type='password'
                autoComplete='current-password'
                value={password}
                disabled={unlocking}
                onChange={e => {
                  setPassword(e.target.value)
                  setRejected(false)
                }}
              />
              <button type='submit' disabled={unlocking || !password}>
                {unlocking ? '解锁中' : '解锁'}
              </button>
            </div>
            {rejected && <p role='alert'>密码不对，再试一次。</p>}
          </form>
        ) : isGallery ? (
          <article id='article-wrapper' className='prose'>
            <Gallery images={galleryImages(post)} />
          </article>
        ) : (
          // 全文索引只收已发布文章的正文：隐藏（Invisible）不收；加密文章静态 HTML 里本来没有正文，这里再兜一层
          <article id='article-wrapper' className='prose' {...(isArticle && post.status === 'Published' && !post.password ? { 'data-pagefind-body': '' } : {})}>
            <NotionPage post={post} onMount={() => setBodyMounted(true)} />
          </article>
        )}
        {!lock && isArticle && (
          <aside className='post-license reveal' aria-label='版权声明'>
            <p>
              <span>作者</span>
              {siteConfig('AUTHOR')}
            </p>
            <p>
              <span>链接</span>
              <a href={pageUrl}>{post.title}</a>
            </p>
            <p>
              <span>许可</span>
              转载请注明出处，采用{' '}
              <a href={siteConfig('READING_LICENSE_URL', null, CONFIG)} target='_blank' rel='noopener noreferrer license'>
                {siteConfig('READING_LICENSE', null, CONFIG)}
              </a>{' '}
              协议
            </p>
            <ShareLink url={pageUrl} title={post.title} />
          </aside>
        )}
        <RelatedPosts posts={related} />
        {isArticle && (prev || next) && (
          <nav className='post-around reveal' aria-label='上一篇和下一篇'>
            {prev ? (
              <PageLink href={prev.href || `/${prev.slug}`}>
                <small>上一篇</small>
                {prev.title}
              </PageLink>
            ) : <span />}
            {next ? (
              <PageLink href={next.href || `/${next.slug}`} className='next'>
                <small>下一篇</small>
                {next.title}
              </PageLink>
            ) : <span />}
          </nav>
        )}
        {!lock && siteConfig('READING_COMMENTS', false, CONFIG) && (
          <section className='comments reveal' aria-label='评论'>
            <LazyComment post={post} />
          </section>
        )}
        {!lock && isArticle && siteConfig('READING_RECENT_COMMENTS', false, CONFIG) && <RecentComments path={path} />}
        <footer className='article-footer'>
          <PageLink href='/'>返回文章列表</PageLink>
          <a href='#content' onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: scrollBehavior() }) }}>
            回到页首
          </a>
        </footer>
      </div>
    </div>
  )
}

/** 分类总览 */
const LayoutCategoryIndex = props => {
  const { categoryOptions = [] } = props
  return (
    <>
      <header className='list-head'>
        <h1>
          分类<span className='title-period'>。</span>
        </h1>
      </header>
      <div className='chips'>
        {categoryOptions.map(c => (
          <PageLink key={c.name} className='chip' href={`/category/${c.name}`}>
            {c.name}
            <span>{c.count}</span>
          </PageLink>
        ))}
      </div>
    </>
  )
}

/** 标签总览 */
const LayoutTagIndex = props => {
  const { tagOptions = [] } = props
  return (
    <>
      <header className='list-head'>
        <h1>
          标签<span className='title-period'>。</span>
        </h1>
      </header>
      <div className='chips tag-chips'>
        {tagOptions.map(t => (
          <PageLink key={t.name} className='chip' href={`/tag/${encodeURIComponent(t.name)}`} title={t.name}>
            <span className='tag-name'>{t.name}</span>
            {t.count ? <span>{t.count}</span> : null}
          </PageLink>
        ))}
      </div>
    </>
  )
}

/** Skills：可安装的 Claude skills */
const LayoutSkills = props => <SkillsBoard data={props.skillsData} />

/** 订阅：RSS 和邮件 */
const LayoutSubscribe = () => <SubscribePage />

/** 404 */
const Layout404 = props => (
  <header className='list-head'>
    <h1>
      这一页不存在<span className='title-period'>。</span>
    </h1>
    <p className='intro-text'>
      可能是链接写错了，或者文章换了地址。<PageLink href='/'>回到文章列表</PageLink>，或者搜一下：
    </p>
    <div className='notfound-search'>
      <SearchBox />
    </div>
    <p className='notfound-random'>
      不知道看什么，就<RandomPost posts={props.allNavPages} />
    </p>
  </header>
)

/** Notion 里的独立页面（about、projects 等）用专门版式，其余照常是文章页 */
const LayoutSlugOrPage = props => {
  const PageLayout = pageLayoutFor(props.post)
  return PageLayout ? <PageLayout {...props} /> : <LayoutSlug {...props} />
}

export {
  Layout404,
  LayoutAbout,
  LayoutArchive,
  LayoutBase,
  LayoutBooks,
  LayoutCategoryIndex,
  LayoutGallery,
  LayoutIndex,
  LayoutLinks,
  LayoutPostList,
  LayoutProjects,
  LayoutSearch,
  LayoutSkills,
  LayoutSlugOrPage as LayoutSlug,
  LayoutSubscribe,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
