/**
 * reading 主题配置：仿 hllqkb.github.io/reading/ 的编辑式归档与阅读版式
 */
const CONFIG = {
  READING_EYEBROW: '技术 / 阅读 / 生活', // 首页大标题上方的小字
  READING_HOME_TITLE: '文章', // 首页大标题（后面自动加一个红色句号）
  READING_HOME_INTRO: '写下思考，也留下生活。', // 首页标题下的一句话
  READING_SIDEBAR_NOTE: '让思考有处安放。', // 文章页左栏底部的一句话
  READING_FOOTER_RIGHT: '霞鹜文楷 · 字里行间', // 页脚右侧
  READING_VERTICAL_TITLE: '写字的人，做工具的人', // 首页右侧竖排的一句话
  READING_SEAL: '水啊', // 印章文字（最多两个字），留空用作者名前两个字
  READING_GALLERY_TAG: '摄影集', // 带这个标签的文章按摄影集版式展示（图片网格 + 大图浏览）
  READING_STREAK: true, // 首页显示写作打卡点阵
  READING_COMMENTS: true, // 文章底部评论区（Waline，服务在 talk.hllqk.cn，见 conf/comment.config.js）
  READING_LICENSE: 'CC BY-NC-SA 4.0', // 文末版权声明里的许可协议
  READING_LICENSE_URL: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans'
}
export default CONFIG
