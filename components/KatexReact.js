import KaTeX from 'katex'
import { memo, useMemo } from 'react'

const escapeHtml = text =>
  String(text).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )

/**
 * 数学公式
 * 渲染期同步生成 HTML，静态导出的页面里直接带公式；服务端和客户端输入相同，输出一致
 * @param {*} param0
 * @returns
 */
const TeX = ({
  children,
  math,
  block,
  errorColor,
  renderError,
  settings,
  as: asComponent,
  ...props
}) => {
  const Component = asComponent || (block ? 'div' : 'span')
  const content = (children ?? math)

  const state = useMemo(() => {
    try {
      const innerHtml = KaTeX.renderToString(content, {
        displayMode: true,
        errorColor,
        throwOnError: !!renderError,
        ...settings
      })

      return { innerHtml }
    } catch (error) {
      // 渲染期执行，异常会中断整站静态导出：一律就地显示错误文字。mhchem 抛的是 [code, message] 数组
      if (renderError) {
        return { errorElement: renderError(error) }
      }
      const message = Array.isArray(error)
        ? error[1]
        : error?.message || String(error)
      return { innerHtml: escapeHtml(message) }
    }
  }, [content, errorColor, renderError, settings])

  if ('errorElement' in state) {
    return state.errorElement
  }

  return (
    <Component
      {...props}
      dangerouslySetInnerHTML={{ __html: state.innerHtml }}
    />
  )
}

export default memo(TeX)
