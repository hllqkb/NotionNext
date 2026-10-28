/* eslint-disable @next/next/no-img-element */
import { ownImageSources } from '@/lib/db/notion/ownImages'
import { useCallback } from 'react'

// 正文栏最宽 744px（reading 主题），窄屏占满视口
const ARTICLE_SIZES = '(max-width: 800px) 100vw, 744px'

/**
 * react-notion-x 的图片组件（forceCustomImages 下所有 LazyImage 都走这里）
 * - 本站托管图：WebP 多尺寸 srcset，原图作回退；带宽高，图片未到时先占好位置
 * - 其余图片（Notion 代理、外链）：与 react-notion-x 默认渲染一致
 * priority（如页面封面）时 eager 加载，其余 lazy
 */
const NotionImage = ({ src, alt, className, style, onLoad, priority }) => {
  const own = ownImageSources(src)
  // 水合前已加载完的图片不会再触发 onLoad，这里补一次，保证放大功能挂上
  const attachLoaded = useCallback(
    img => {
      if (img?.complete && img.naturalWidth) onLoad?.({ target: img })
    },
    [onLoad]
  )
  const common = {
    ref: attachLoaded,
    className,
    style,
    alt,
    loading: priority ? 'eager' : 'lazy',
    fetchPriority: priority ? 'high' : undefined,
    decoding: 'async',
    onLoad
  }

  if (!own) return <img {...common} src={src} />
  if (!own.webp) {
    return <img {...common} src={own.original} width={own.width} height={own.height} />
  }

  // 不支持 WebP 的浏览器忽略 <source>，回退到原图；display: contents 不改变原有布局
  return (
    <picture style={{ display: 'contents' }}>
      <source type='image/webp' srcSet={own.srcSet} sizes={ARTICLE_SIZES} />
      <img
        {...common}
        src={own.original}
        width={own.width}
        height={own.height}
        // 放大查看用原尺寸 WebP（NotionPage 的放大逻辑见到已有该属性就不再改写）
        data-zoom-src={own.webp}
      />
    </picture>
  )
}

export default NotionImage
