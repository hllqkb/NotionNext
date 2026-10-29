import  { createRef, useEffect } from 'react'
import { init } from '@waline/client'
import { useRouter } from 'next/router'
import '@waline/client/style'
import { siteConfig } from '@/lib/config'

const path = ''
let waline = null
/**
 * @see https://waline.js.org/guide/get-started.html
 * @param {*} props
 * @returns
 */
const WalineComponent = (props) => {
  const containerRef = createRef()
  const router = useRouter()

  const updateWaline = url => {
    if (url !== path && waline) {
      waline.update(props)
    }
  }

  useEffect(() => {
    if (!waline) {
      // 表情包放在本站 public/vendor/waline-emojis@1.1.0/，不走 elemecdn / unpkg；
      // Waline 会把表情地址原样写进评论 HTML，所以拼成站点绝对地址，后台和邮件里也能显示
      const emojiBase = `${String(siteConfig('LINK') || '').replace(/\/$/, '')}/vendor/waline-emojis@1.1.0`
      waline = init({
        ...props,
        el: containerRef.current,
        serverURL: siteConfig('COMMENT_WALINE_SERVER_URL'),
        lang: siteConfig('LANG'),
        // 与 Waline 默认的 6 个文章反应同图同序（计数按位置存），只是换成本站地址
        reaction: [
          'agree',
          'look_down',
          'sunglasses',
          'pick_nose',
          'awkward',
          'sleep'
        ].map(name => `${emojiBase}/tieba/tieba_${name}.png`),
        dark: 'html.dark',
        emoji: ['tieba', 'weibo', 'bilibili'].map(pack => `${emojiBase}/${pack}`)
      })
    }

    // 跳转评论
    router.events.on('routeChangeComplete', updateWaline)
    const anchor = window.location.hash
    if (anchor) {
      // 选择需要观察变动的节点
      const targetNode = document.getElementsByClassName('wl-cards')[0]

      // 当观察到变动时执行的回调函数
      const mutationCallback = (mutations) => {
        for (const mutation of mutations) {
          const type = mutation.type
          if (type === 'childList') {
            const anchorElement = document.getElementById(anchor.substring(1))
            if (anchorElement && anchorElement.className === 'wl-item') {
              anchorElement.scrollIntoView({ block: 'end', behavior: 'smooth' })
              setTimeout(() => {
                anchorElement.classList.add('animate__animated')
                anchorElement.classList.add('animate__bounceInRight')
                observer.disconnect()
              }, 300)
            }
          }
        }
      }

      // 观察子节点 变化
      const observer = new MutationObserver(mutationCallback)
      observer.observe(targetNode, { childList: true })
    }

    return () => {
      if (waline) {
        waline.destroy()
        waline = null
      }
      router.events.off('routeChangeComplete', updateWaline)
    }
  }, [])

  return <div ref={containerRef} />
}

export default WalineComponent
