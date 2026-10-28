import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { DynamicLayout } from '@/themes/theme'
import { useRouter } from 'next/router'

/**
 * 搜索路由
 * @param {*} props
 * @returns
 */
const Search = props => {
  const { posts } = props

  const router = useRouter()
  const keyword = String(router?.query?.s || '').trim()

  // 静态导出后 ?s= 只在客户端可读：在已下发的文章列表里匹配标题、摘要、分类、标签，空格分隔的词都要命中
  const terms = String(keyword || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  const filteredPosts = terms.length
    ? (posts || []).filter(post => {
        const text = [post.title, post.summary, [].concat(post.category || []), [].concat(post.tags || [])]
          .flat()
          .join(' ')
          .toLowerCase()
        return terms.every(t => text.includes(t))
      })
    : []

  props = {
    ...props,
    allPosts: posts || [],
    posts: filteredPosts,
    postCount: filteredPosts.length,
    keyword: keyword || ''
  }

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSearch' {...props} />
}

/**
 * 浏览器前端搜索
 */
export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({
    from: 'search-props',
    locale
  })
  const { allPages } = props
  props.posts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  delete props.allPages
  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export default Search
