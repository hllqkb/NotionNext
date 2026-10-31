/**
 * reading 主题配置：仿 hllqkb.github.io/reading/ 的编辑式归档与阅读版式
 */
const CONFIG = {
  READING_DEFAULT_FONT: 'wenkai', // 默认字体：wenkai 文楷 / song 本机宋体 / hei 本机黑体 / system 系统
  READING_DEFAULT_THEME: 'auto', // 默认配色：auto 自动 / paper 纸色 / green 浅绿 / night 夜间 / white 纯白 / ink 墨水屏
  READING_DEFAULT_SIZE: 'm', // 默认字号：s 小 / m 中 / l 大
  READING_DEFAULT_LEADING: 'standard', // 默认行距：compact 紧凑 / standard 标准 / loose 宽松
  READING_DEFAULT_WIDTH: 'standard', // 默认版心：narrow 窄 / standard 标准 / wide 宽
  READING_DEFAULT_INDENT: 'off', // 默认首行缩进：off 关闭 / on 开启
  READING_DEFAULT_ALIGN: 'start', // 默认对齐：start 左对齐 / justify 两端对齐
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
  // 邮件订阅（follow.it，feed 名 hllqkb-blog）的表单提交地址，公开的；留空就不显示邮件订阅表单
  READING_FOLLOWIT_ACTION: 'https://api.follow.it/subscription-form/RUgxWldlVVdJQUNyUnRkVm8xSGpoRXR6bDZRUldYN04zYVI0QTc5VEd5NmZmNFZWeDVGSEQzM0txVGlYcVFWRkV4OGxEK1JrMEk2NVo3NG1YZ1Yxc3dad0FHbWMzRERkV2w3WVJWalM0ZkhpaHJDUVcvVVUzMlkveDJJTzk2YUR8eEkzaEppYnhNbzcxVitlTWdlTERqY0V5Y05uazhqYldGajdvUjBOYmhRYz0=/8',
  CUSTOM_RIGHT_CLICK_CONTEXT_MENU: false // 自定义右键菜单的图标依赖 Font Awesome，本主题不加载，改用浏览器原生菜单
}
export default CONFIG
