import BLOG from '@/blog.config'
import { convertVal, siteConfig } from '@/lib/config'

/**
 * 分类、标签列表页去掉整站文章列表：reading 主题的这几个布局不读它们，
 * 留着会让每页 __NEXT_DATA__ 多出约 100KB（gzip 后 HTML 约 37KB -> 16KB）。
 * 其他主题的侧栏可能要用，所以只在 reading 下删。
 */
export function trimListProps(props) {
  if (siteConfig('THEME', BLOG.THEME, props?.NOTION_CONFIG) !== 'reading') {
    return props
  }
  // reading 默认关掉自定义右键菜单；Notion 配置里重新打开时，菜单的「随机文章」要读 allNavPages
  const contextMenu = props?.NOTION_CONFIG?.CUSTOM_RIGHT_CLICK_CONTEXT_MENU
  if (contextMenu === undefined || contextMenu === null || !convertVal(contextMenu)) {
    delete props.allNavPages
  }
  delete props.allLinkPages
  delete props.latestPosts
  return props
}
