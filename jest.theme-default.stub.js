// Jest 里 @theme-default 的替身：不导出任何布局，themes/theme.js 会回到动态 import 路径，
// 和静态引入默认主题之前的测试行为一致。真实主题会经 lib/config → lib/global → themes/theme
// 把 react-notion-x、notion-utils 等纯 ESM 包拉进几乎所有单测，Jest 默认不转译 node_modules。
module.exports = {}
