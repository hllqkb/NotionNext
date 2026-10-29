/**
 * reading 主题配置：仿 hllqkb.github.io/reading/ 的编辑式归档与阅读版式
 */
const CONFIG = {
  READING_EYEBROW: '技术 / 阅读 / 生活', // 首页大标题上方的小字
  READING_HOME_TITLE: '文章', // 首页大标题（后面自动加一个红色句号）
  READING_HOME_INTRO: '写下思考，也留下生活。', // 首页标题下的一句话
  READING_SIDEBAR_NOTE: '让思考有处安放。', // 文章页左栏底部的一句话
  READING_FOOTER_RIGHT: '霞鹜文楷 · 字里行间', // 页脚右侧
  READING_VERTICAL_TITLE: '天若有情天亦老 人间正道是沧桑', // 首页右侧竖排的句子，空格分成两列（右边是上句）
  READING_SEAL: 'hllqk', // 印章文字：中文最多两个字竖排，英文横排；留空用作者名
  READING_DEFAULT_CATEGORY: '随笔', // Notion 里没选 category 的文章归到这个分类
  READING_GALLERY_TAG: '摄影集', // 带这个标签的文章按摄影集版式展示（图片网格 + 大图浏览）
  READING_STREAK: true, // 首页显示写作打卡点阵
  // 首页「从这里读起」：优先取 Notion 里勾了 featured 的文章（最多 3 篇）；一篇都没勾时用这里的 slug，逗号分隔
  READING_PICKS: 'article/csdn-150206503-sift-7,article/csdn-150112173-ml2023spring-hw4-bossline-0-95125,article/ai-coding-faster-stuck',
  READING_COMMENTS: true, // 文章底部评论区（Waline，服务在 talk.hllqk.cn，见 conf/comment.config.js）
  READING_PAGEVIEWS: true, // 文章页显示阅读量（Waline 文章计数，失败时不显示）
  READING_RECENT_COMMENTS: false, // 文末最近评论（Waline）。评论库里还有测试和不当留言，清理后再打开
  READING_STALE_CATEGORY: '技术分享', // 这个分类的文章发布满一年，标题下提示内容可能过时
  READING_LICENSE: 'CC BY-NC-SA 4.0', // 文末版权声明里的许可协议
  READING_LICENSE_URL: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans',
  CUSTOM_RIGHT_CLICK_CONTEXT_MENU: false // 自定义右键菜单的图标依赖 Font Awesome，本主题不加载，改用浏览器原生菜单
}
export default CONFIG
