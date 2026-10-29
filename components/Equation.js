import * as React from 'react'

import Katex from '@/components/KatexReact'
// 公式样式跟着公式组件走：只有带公式的页面才加载，不进全局 CSS
import 'katex/dist/katex.min.css'
// 化学方程式宏（\ce、\pu），要在渲染公式前注册
import '@/lib/plugins/mhchem'
import { getBlockTitle } from 'notion-utils'

const katexSettings = {
  throwOnError: false,
  strict: false
}

/**
 * 数学公式
 * @param {} param0
 * @returns
 */
export const Equation = ({ block, math, inline = false, className, ...rest }) => {
  math = math || getBlockTitle(block, null)
  if (!math) return null

  return (
    <span
      role='button'
      tabIndex={0}
      className={`notion-equation ${inline ? 'notion-equation-inline' : 'notion-equation-block'}`}
    >
      <Katex math={math} settings={katexSettings} {...rest} />
    </span>
  )
}
