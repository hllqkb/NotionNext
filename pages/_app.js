// import '@/styles/animate.css' // @see https://animate.style/
import '@/styles/globals.css'
import '@/styles/utility-patterns.css'
// Notion 正文样式（styles/notion.css，含 react-notion-x 和 KaTeX）跟着 components/NotionPage.js 按页加载

import useAdjustStyle from '@/hooks/useAdjustStyle'
import { GlobalContextProvider } from '@/lib/global'
import { getBaseLayoutByTheme } from '@/themes/theme'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { getQueryParam } from '../lib/utils'
import ErrorHandler from '@/lib/utils/errorHandler'

// 各种扩展插件 这个要阻塞引入
import BLOG from '@/blog.config'
import ExternalPlugins from '@/components/ExternalPlugins'
import PWAInstaller from '@/components/PWAInstaller'
import SEO from '@/components/SEO'
import dynamic from 'next/dynamic'
// 中文文案（zh-CN 约 64KB）和 ClerkProvider 一起放在动态边界后面，没配 Clerk 时不进 _app
const ClerkProvider = dynamic(() =>
  Promise.all([
    import('@clerk/nextjs'),
    import('@clerk/localizations/zh-CN')
  ]).then(([{ ClerkProvider }, { zhCN }]) => {
    const LocalizedClerkProvider = props => (
      <ClerkProvider localization={zhCN} {...props} />
    )
    return LocalizedClerkProvider
  })
)
// reading 主题的出错页：主题本身已经崩了，样式不能靠 #theme-reading，这里自带纸墨色和文楷；其他主题仍用原来的通用页
const READING_ERROR_STYLE = `
  .reading-error { --paper: #f7f6f0; --ink: #34352e; --muted: #6b6b61; --accent: #aa533b; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 0 24px; background: var(--paper); color: var(--ink); font: 400 18px/1.8 'LXGW WenKai', 'Kaiti SC', STKaiti, KaiTi, 'Songti SC', SimSun, serif; }
  .dark .reading-error { --paper: #1c1b18; --ink: #e6e2d8; --muted: #a29d91; --accent: #e0896e; }
  .reading-error > div { width: 100%; max-width: 560px; margin: 0 auto; }
  .reading-error h1 { margin: 0 0 12px; font-size: 40px; font-weight: 400; line-height: 1.3; }
  .reading-error h1 span { color: var(--accent); font-size: .78em; }
  .reading-error p { margin: 0 0 28px; color: var(--muted); }
  .reading-error nav { display: flex; gap: 28px; font-size: 16px; }
  .reading-error button, .reading-error a { padding: 2px 0; border: 0; border-bottom: 1px solid currentColor; background: none; color: var(--accent); font: inherit; cursor: pointer; text-decoration: none; }
`
const errorFallback = ({ theme }) =>
  theme === 'reading' ? (
    <div className='reading-error' role='alert'>
      <style>{READING_ERROR_STYLE}</style>
      <div>
        <h1>
          这一页出了点岔子<span>。</span>
        </h1>
        <p>页面加载时出错了，刷新一下通常就好；还不行，就先回到文章列表。</p>
        <nav>
          <button type='button' onClick={() => window.location.reload()}>
            刷新
          </button>
          <a href='/'>回到文章列表</a>
        </nav>
      </div>
    </div>
  ) : (
    <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>An unexpected error occurred. Please refresh the page.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: 'transparent' }}>Refresh</button>
    </div>
  )
const AppErrorBoundary = ErrorHandler.createErrorBoundary(errorFallback)

/**
 * App挂载DOM 入口文件
 * @param {*} param0
 * @returns
 */
const MyApp = ({ Component, pageProps }) => {
  // 一些可能出现 bug 的样式，可以统一放入该钩子进行调整
  useAdjustStyle()

  const route = useRouter()
  const queryTheme = getQueryParam(route.asPath, 'theme')
  const notionTheme = pageProps?.NOTION_CONFIG?.THEME
  const configTheme = BLOG.THEME
  const theme = useMemo(() => {
    return queryTheme || notionTheme || configTheme
  }, [queryTheme, notionTheme, configTheme])

  // 整体布局
  const GLayout = useCallback(
    props => {
      const Layout = getBaseLayoutByTheme(theme)
      return <Layout {...props} />
    },
    [theme]
  )

  const enableClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const content = (
    <AppErrorBoundary theme={theme}>
      <GlobalContextProvider {...pageProps}>
        <GLayout {...pageProps}>
          <SEO {...pageProps} />
          <Component {...pageProps} />
        </GLayout>
        <PWAInstaller NOTION_CONFIG={pageProps?.NOTION_CONFIG} />
        <ExternalPlugins {...pageProps} />
      </GlobalContextProvider>
    </AppErrorBoundary>
  )
  return (
    <>
      {enableClerk ? (
        <ClerkProvider>{content}</ClerkProvider>
      ) : (
        content
      )}
    </>
  )
}

export default MyApp
