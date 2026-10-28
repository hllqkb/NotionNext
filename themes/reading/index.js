'use client'

import NotionPage from '@/components/NotionPage'
import dynamic from 'next/dynamic'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import { isBrowser } from '@/lib/utils'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { CategoryChips, LockIcon, Masthead, Seal, SiteFooter, WritingStreak, YearGroups, filterByCategory, hasCover, postDay, useReveal } from './components/Frame'
import Gallery, { galleryImages } from './components/Gallery'

const Comment = dynamic(() => import('@/components/Comment'), { ssr: false })
import Toc from './components/Toc'
import CONFIG from './config'
import { Style } from './style'

/**
 * 基础框架：文章页自己排版（左目录右正文），其余页面放进 .page 版心
 */
const LayoutBase = props => {
  const { children, siteInfo, post } = props
  const revealReady = useReveal()
  return (
    <div id='theme-reading' className={`${siteConfig('FONT_STYLE')} ${revealReady ? 'reveal-ready' : ''}`}>
      <Style />
      <div className='page'>
        <Masthead siteInfo={siteInfo} />
        {!post && <main id='content'>{children}</main>}
      </div>
      {post && <main id='content'>{children}</main>}
      <SiteFooter siteInfo={siteInfo} />
    </div>
  )
}

/** 搜索框：回车跳到 /search/关键词 */
const SearchBox = ({ keyword = '' }) => {
  const router = useRouter()
  const [value, setValue] = useState(keyword)
  return (
    <form
      className='search-box'
      role='search'
      onSubmit={e => {
        e.preventDefault()
        const kw = value.trim()
        router.push(kw ? `/search/${encodeURIComponent(kw)}` : '/')
      }}>
      <label htmlFor='reading-search' className='sr-only'>
        搜索文章
      </label>
      <input
        id='reading-search'
        type='search'
        placeholder='搜索标题或内容，回车'
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  )
}

/** 最近一篇：大号展示 */
const LeadStory = ({ post }) => (
  <article className={`lead-story reveal${hasCover(post) ? ' has-cover' : ''}`}>
    {hasCover(post) && (
      <SmartLink href={post.href} className='lead-cover' tabIndex={-1} aria-hidden='true'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.pageCoverThumbnail} alt='' loading='lazy' />
      </SmartLink>
    )}
    <div className='lead-meta'>
      <span>最近一篇</span>
      <time dateTime={postDay(post)}>{String(postDay(post)).replaceAll('-', '.')}</time>
      {post.category && <span>{post.category}</span>}
    </div>
    <h2>
      <SmartLink href={post.href}>
        {post.password && <LockIcon />}
        {post.title}
      </SmartLink>
    </h2>
    <div className='lead-row'>
      <p>{post.summary}</p>
      <SmartLink className='read-link' href={post.href} aria-label={`阅读：${post.title}`}>
        阅读全文<span aria-hidden='true'>↗</span>
      </SmartLink>
    </div>
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
          <p className='vertical-title'>{siteConfig('READING_VERTICAL_TITLE', null, CONFIG)}</p>
          <Seal text={siteConfig('READING_SEAL', null, CONFIG) || siteConfig('AUTHOR')} />
        </div>
      </header>
      {siteConfig('READING_STREAK', true, CONFIG) && <WritingStreak pages={props.allNavPages || posts} />}
      <div className='collection-bar'>
        <p>全部 {postCount || posts.length} 篇</p>
        <SearchBox />
      </div>
      <CategoryChips posts={posts} value={cat} onChange={setCat} />
      {lead && !cat && <LeadStory post={lead} />}
      <YearGroups posts={listed} />
      {postCount > posts.length && (
        <div className='pager'>
          <span />
          <SmartLink href='/archive'>查看全部文章 →</SmartLink>
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
  const title = category ? `分类：${category}` : tag ? `#${tag}` : '文章'
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
          {page > 1 ? <SmartLink href={page - 1 === 1 ? base || '/' : `${base}/page/${page - 1}`}>← 上一页</SmartLink> : <span />}
          {page < totalPage ? <SmartLink href={`${base}/page/${page + 1}`}>下一页 →</SmartLink> : <span />}
        </div>
      )}
    </>
  )
}

/** 搜索结果 */
const LayoutSearch = props => {
  const { keyword, posts = [] } = props
  return (
    <>
      <header className='list-head'>
        <h1>
          搜索<span className='title-period'>。</span>
        </h1>
      </header>
      <div className='collection-bar'>
        <p>{keyword ? `「${keyword}」共 ${posts.length} 篇` : '输入关键词搜索'}</p>
        <SearchBox keyword={keyword} />
      </div>
      <YearGroups posts={posts} />
    </>
  )
}

/** 归档：全部文章按年 */
const LayoutArchive = props => {
  const { posts = [] } = props
  const [cat, setCat] = useState('')
  return (
    <>
      <header className='list-head'>
        <h1>
          归档<span className='title-period'>。</span>
        </h1>
      </header>
      <div className='collection-bar'>
        <p>全部 {posts.length} 篇</p>
        <SearchBox />
      </div>
      <CategoryChips posts={posts} value={cat} onChange={setCat} />
      <YearGroups posts={filterByCategory(posts, cat)} />
    </>
  )
}

/** 文章页：左侧目录，右侧正文 */
const LayoutSlug = props => {
  const { post, lock, validPassword } = props
  const router = useRouter()
  const [password, setPassword] = useState('')

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
  return (
    <div className='reading-shell'>
      <aside className='sidebar' aria-label='阅读导航'>
        <SmartLink className='all-articles' href='/'>
          全部文章
        </SmartLink>
        {!lock && <Toc toc={post.toc} />}
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
            {day && <time dateTime={day}>{String(day).replaceAll('-', ' / ')}</time>}
          </p>
          <h1>{post.title}</h1>
          {post.tags?.length > 0 && (
            <div className='byline'>
              {post.tags.map(t => (
                <SmartLink key={t} href={`/tag/${encodeURIComponent(t)}`}>
                  #{t}
                </SmartLink>
              ))}
            </div>
          )}
        </header>
        {lock ? (
          <form
            onSubmit={e => {
              e.preventDefault()
              validPassword(password)
            }}>
            <p>这篇文章需要密码。</p>
            <input type='password' value={password} onChange={e => setPassword(e.target.value)} />
          </form>
        ) : isGallery ? (
          <article id='article-wrapper' className='prose'>
            <Gallery images={galleryImages(post)} />
          </article>
        ) : (
          <article id='article-wrapper' className='prose'>
            <NotionPage post={post} />
          </article>
        )}
        {!lock && siteConfig('READING_COMMENTS', false, CONFIG) && (
          <section className='comments reveal' aria-label='评论'>
            <Comment frontMatter={post} />
          </section>
        )}
        <footer className='article-footer'>
          <SmartLink href='/'>返回文章列表</SmartLink>
          <a href='#content' onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
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
          <SmartLink key={c.name} className='chip' href={`/category/${c.name}`}>
            {c.name}
            <span>{c.count}</span>
          </SmartLink>
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
      <div className='chips'>
        {tagOptions.map(t => (
          <SmartLink key={t.name} className='chip' href={`/tag/${encodeURIComponent(t.name)}`}>
            #{t.name}
            {t.count ? <span>{t.count}</span> : null}
          </SmartLink>
        ))}
      </div>
    </>
  )
}

/** 404 */
const Layout404 = () => (
  <header className='list-head'>
    <h1>
      这一页不存在<span className='title-period'>。</span>
    </h1>
    <p className='intro-text'>
      可能是链接写错了，或者文章换了地址。<SmartLink href='/'>回到文章列表</SmartLink>
    </p>
  </header>
)

export {
  Layout404,
  LayoutArchive,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutIndex,
  LayoutPostList,
  LayoutSearch,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
