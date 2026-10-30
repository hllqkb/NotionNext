import KaTeX from 'katex'
import { memo, useMemo, useState, useSyncExternalStore } from 'react'

const escapeHtml = text =>
  String(text).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )

const noopSubscribe = () => () => {}

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

  // 首次水合时直接沿用服务端已输出的公式 DOM，不在客户端重算（长文几十个公式会拖长水合）；
  // 水合之后才挂载的（客户端跳转进来的页面）或公式内容变了，照常计算
  const hydrating = useSyncExternalStore(noopSubscribe, () => false, () => true)
  const [serverContent] = useState(() =>
    hydrating && typeof window !== 'undefined' && !renderError ? content : null
  )
  const reuseServerHtml = serverContent !== null && serverContent === content

  const state = useMemo(() => {
    if (reuseServerHtml) return null
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
  }, [reuseServerHtml, content, errorColor, renderError, settings])

  if (!state) {
    // 水合时 React 不会改写 dangerouslySetInnerHTML 节点的服务端内容，这里留空即可
    return (
      <Component
        {...props}
        dangerouslySetInnerHTML={{ __html: '' }}
        suppressHydrationWarning
      />
    )
  }

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
