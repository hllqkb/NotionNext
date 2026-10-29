/**
 * 网页中代码显示的效果
 */
module.exports = {
  // START********代码相关********
  // PrismJs 代码相关
  // autoloader、语言包、主题都放在本站 public/vendor/prism/（按 npm 包版本分目录），不依赖 jsDelivr、elemecdn
  // 语言包版本跟 package.json 里打包进来的 prismjs 核心保持一致；升级 prismjs 时一起换目录
  PRISM_JS_PATH: '/vendor/prism/prismjs@1.30.0/components/',
  PRISM_JS_AUTO_LOADER:
    '/vendor/prism/prismjs@1.30.0/plugins/autoloader/prism-autoloader.min.js',

  // 代码主题 @see https://github.com/PrismJS/prism-themes
  // 浅色/深色用同一套 One Light / One Dark（Atom One 配色，prism-themes 收录），跟随站点深浅色切换
  PRISM_THEME_PREFIX_PATH:
    process.env.NEXT_PUBLIC_PRISM_THEME_PREFIX_PATH ||
    '/vendor/prism/prismjs@1.30.0/themes/prism-okaidia.min.css', // 代码块默认主题
  PRISM_THEME_SWITCH: process.env.NEXT_PUBLIC_PRISM_THEME_SWITCH || true, // 是否开启浅色/深色模式代码主题切换； 开启后将显示以下两个主题
  PRISM_THEME_LIGHT_PATH:
    process.env.NEXT_PUBLIC_PRISM_THEME_LIGHT_PATH ||
    '/vendor/prism/prism-themes@1.9.0/themes/prism-one-light.min.css', // 浅色模式主题
  PRISM_THEME_DARK_PATH:
    process.env.NEXT_PUBLIC_PRISM_THEME_DARK_PATH ||
    '/vendor/prism/prism-themes@1.9.0/themes/prism-one-dark.min.css', // 深色模式主题

  CODE_FRAME: process.env.NEXT_PUBLIC_CODE_FRAME || true, // 统一代码框：mac 圆点、语言名、复制、折叠在同一条头部（样式在 themes/reading/style.js）；关掉则回到 pre-mac + 折叠条的旧样式
  CODE_MAC_BAR: process.env.NEXT_PUBLIC_CODE_MAC_BAR || true, // 代码左上角显示mac的红黄绿图标
  CODE_LINE_NUMBERS: process.env.NEXT_PUBLIC_CODE_LINE_NUMBERS || false, // 是否显示行号
  CODE_COLLAPSE: process.env.NEXT_PUBLIC_CODE_COLLAPSE || true, // 是否支持折叠代码框
  CODE_COLLAPSE_EXPAND_DEFAULT:
    process.env.NEXT_PUBLIC_CODE_COLLAPSE_EXPAND_DEFAULT || false, // 超过行数的代码默认收起到 CODE_COLLAPSE_MIN_LINES 行
  CODE_COLLAPSE_MIN_LINES:
    process.env.NEXT_PUBLIC_CODE_COLLAPSE_MIN_LINES || 20, // 超过该行数的代码块默认收起到这么多行，底部给「展开全部」
  // Mermaid 图表CDN
  MERMAID_CDN:
    process.env.NEXT_PUBLIC_MERMAID_CDN ||
    'https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.0/mermaid.min.js' // CDN

  // END********代码相关********
}
