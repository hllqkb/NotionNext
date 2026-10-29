import { useRouter } from 'next/router'
import { useEffect } from 'react'

const loaded = new Set()

const normalize = pathname => pathname.replace(/\/+$/, '') || '/'

/**
 * 客户端跳转时补上新页面的霞鹜文楷子集：scripts/font-subset.mjs 为每页生成 /font-css/<路由>.css。
 * 首访那一页的子集已内联在 HTML 的 <style id="wenkai-font"> 里；
 * 没有这个 style（开发环境，或构建时退回了旧的整套切片）就什么都不做。
 */
export const usePageFont = () => {
  const { asPath } = useRouter()
  useEffect(() => {
    if (document.getElementById('wenkai-font')?.tagName !== 'STYLE') return
    const route = normalize(window.location.pathname)
    if (loaded.size === 0) {
      loaded.add(route)
      return
    }
    if (loaded.has(route)) return
    loaded.add(route)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `/font-css${route === '/' ? '/index' : route}.css`
    document.head.appendChild(link)
  }, [asPath])
}
