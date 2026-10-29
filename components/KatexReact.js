import KaTeX from 'katex'
import { memo, useMemo } from 'react'

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
      if (error instanceof KaTeX.ParseError || error instanceof TypeError) {
        if (renderError) {
          return { errorElement: renderError(error) }
        }
        return { innerHtml: error.message }
      }
      throw error
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
