import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'

/**
 * 分类、标签列表页去掉整站文章列表：reading 主题的这几个布局不读它们，
 * 留着会让每页 __NEXT_DATA__ 多出约 100KB（gzip 后 HTML 约 37KB -> 16KB）。
 * 其他主题的侧栏可能要用，所以只在 reading 下删。
 */
export function trimListProps(props) {
  if (siteConfig('THEME', BLOG.THEME, props?.NOTION_CONFIG) !== 'reading') {
    return props
  }
  delete props.allNavPages
  delete props.allLinkPages
  delete props.latestPosts
  return props
}
