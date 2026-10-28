/**
 * 订阅源条目：已发布文章按发布时间倒序取前 count 篇。
 * 不复用 latestPosts，它按最后编辑时间排序，改一次旧文就会把旧文顶到订阅源最前面。
 * @param {Array} allPages 全站页面
 * @param {number} count 条数
 * @returns {Array}
 */
export function getFeedPosts(allPages, count = 20) {
  return (allPages || [])
    .filter(page => page?.type === 'Post' && page?.status === 'Published')
    .sort((a, b) => (b?.publishDate || 0) - (a?.publishDate || 0))
    .slice(0, count)
}
