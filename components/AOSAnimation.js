import { loadExternalResource } from '@/lib/utils'
import { useEffect } from 'react'

/**
 * 加载滚动动画
 * 改从外部CDN读取
 * https://michalsnik.github.io/aos/
 */
export default function AOSAnimation() {
  const initAOS = () => {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    Promise.all([
      loadExternalResource('/js/aos.js', 'js'),
      loadExternalResource('/css/aos.css', 'css')
    ]).then(() => {
      // 切主题会让本组件卸载再挂载；AOS.init 每次都加全局监听，已初始化过就只刷新
      if (window.AOS && window.__aosInited) {
        window.AOS.refreshHard()
      } else if (window.AOS) {
        window.__aosInited = true
        window.AOS.init({
          debounceDelay: 100,
          throttleDelay: 120,
          once: true
        })
      }
    })
  }
  useEffect(() => {
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(initAOS, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(initAOS, 2000)
    return () => window.clearTimeout(id)
  }, [])

  return null
}
