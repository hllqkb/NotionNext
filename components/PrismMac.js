import { useEffect } from 'react'
import Prism from 'prismjs'
// 所有语言的prismjs 使用autoloader引入
// import 'prismjs/plugins/autoloader/prism-autoloader'
import 'prismjs/plugins/toolbar/prism-toolbar'
import 'prismjs/plugins/toolbar/prism-toolbar.min.css'
import 'prismjs/plugins/show-language/prism-show-language'
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'

// mermaid图
import { loadExternalResource } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'

const PRISM_MAC_STYLE_PATH = '/css/prism-mac-style.css'

/**
 * 代码美化相关
 * @author https://github.com/txs/
 * @returns
 */
const PrismMac = ({ blockMap } = {}) => {
  const pathname = usePathname()
  const { isDarkMode } = useGlobal()
  const codeMacBar = siteConfig('CODE_MAC_BAR')
  const prismjsAutoLoader = siteConfig('PRISM_JS_AUTO_LOADER')
  const prismjsPath = siteConfig('PRISM_JS_PATH')

  const prismThemeSwitch = siteConfig('PRISM_THEME_SWITCH')
  const prismThemeDarkPath = siteConfig('PRISM_THEME_DARK_PATH')
  const prismThemeLightPath = siteConfig('PRISM_THEME_LIGHT_PATH')
  const prismThemePrefixPath = siteConfig('PRISM_THEME_PREFIX_PATH')

  const mermaidCDN = siteConfig('MERMAID_CDN')
  const codeLineNumbers = siteConfig('CODE_LINE_NUMBERS')

  const codeCollapse = siteConfig('CODE_COLLAPSE')
  const codeCollapseExpandDefault = siteConfig('CODE_COLLAPSE_EXPAND_DEFAULT')
  const codeCollapseMinLines = Number(siteConfig('CODE_COLLAPSE_MIN_LINES', 20))
  // 统一代码框：mac 圆点、语言名、复制、折叠放在同一条头部，替代 pre-mac + 折叠条
  const codeFrame = siteConfig('CODE_FRAME')

  useEffect(() => {
    let isDisposed = false
    let stopLineNumbers = () => {}
    let stopMermaid = () => {}
    let observer = null
    let newCodeBlocksObserver = null
    let initTimer = null
    let enhancementTimer = null
    let hasInitialized = false
    const rawCodeById = codeFrame ? buildRawCodeMap(blockMap) : {}

    const cleanupPrism = () => {
      try {
        stopLineNumbers()
      } catch (e) {
        /* ignore */
      }

      try {
        stopMermaid()
      } catch (e) {
        /* ignore */
      }
      stopLineNumbers = () => {}
      stopMermaid = () => {}
    }

    const renderCodeEnhancements = () => {
      if (isDisposed) return

      try {
        cleanupPrism()
        if (typeof window !== 'undefined' && !window.Prism) {
          window.Prism = Prism
        }
        if (window?.Prism?.plugins?.autoloader) {
          window.Prism.plugins.autoloader.languages_path = prismjsPath
        }

        const dispose = renderPrismMac(codeLineNumbers, codeMacBar && !codeFrame)
        stopLineNumbers = typeof dispose === 'function' ? dispose : () => {}
        const disposeMermaid = renderMermaid(mermaidCDN)
        stopMermaid =
          typeof disposeMermaid === 'function' ? disposeMermaid : () => {}
        if (codeFrame) {
          renderCodeFrames({
            macBar: codeMacBar,
            collapse: codeCollapse,
            expandDefault: codeCollapseExpandDefault,
            minLines: codeCollapseMinLines,
            rawCodeById
          })
        } else {
          renderCollapseCode(codeCollapse, codeCollapseExpandDefault)
        }
        getNotionArticle()
          ?.querySelectorAll('pre.notion-code')
          .forEach(codeBlock => {
            codeBlock.dataset.prismMacEnhanced = 'true'
          })
      } catch (err) {
        console.warn('[PrismMac] render failed:', err)
      }
    }

    const containsUnenhancedCodeBlock = node => {
      if (node?.nodeType !== 1) return false
      if (
        node.matches?.('pre.notion-code') &&
        node.dataset?.prismMacEnhanced !== 'true'
      ) {
        return true
      }

      return Array.from(node.querySelectorAll?.('pre.notion-code') || []).some(
        codeBlock => codeBlock.dataset.prismMacEnhanced !== 'true'
      )
    }

    const observeNewCodeBlocks = article => {
      newCodeBlocksObserver?.disconnect()
      newCodeBlocksObserver = new MutationObserver(mutations => {
        const hasNewCodeBlock = mutations.some(mutation =>
          Array.from(mutation.addedNodes).some(containsUnenhancedCodeBlock)
        )
        if (!hasNewCodeBlock || enhancementTimer) return

        enhancementTimer = window.setTimeout(() => {
          enhancementTimer = null
          renderCodeEnhancements()
        }, 0)
      })
      newCodeBlocksObserver.observe(article, {
        childList: true,
        // Tabs and toggles can insert code several levels below the article.
        subtree: true
      })
    }

    const loadCodeStyleSheets = () => {
      // 加载 Prism 主题后再次移动 Mac 样式到最后，避免刷新时被异步主题 CSS 覆盖。
      const prismThemeReady = loadPrismThemeCSS(
        isDarkMode,
        prismThemeSwitch,
        prismThemeDarkPath,
        prismThemeLightPath,
        prismThemePrefixPath
      )
      if ((codeMacBar || codeCollapse) && !codeFrame) {
        loadPrismMacStyleCSS()
        Promise.resolve(prismThemeReady)
          .catch(err => {
            console.warn('[PrismMac] prism theme load failed:', err)
          })
          .finally(() => {
            loadPrismMacStyleCSS()
          })
      }
    }

    const initCodeEnhancements = () => {
      if (isDisposed || hasInitialized) return true

      const article = getNotionArticle()
      const hasCodeBlocks = Boolean(article?.querySelector('pre.notion-code'))
      if (!hasCodeBlocks) return false

      hasInitialized = true
      observer?.disconnect()
      observer = null
      if (initTimer) {
        clearTimeout(initTimer)
        initTimer = null
      }

      loadCodeStyleSheets()

      // 先用本地 Prism 渲染，避免外部 autoloader 阻塞基础代码增强。
      renderCodeEnhancements()
      observeNewCodeBlocks(article)

      loadExternalResource(prismjsAutoLoader, 'js')
        .then(() => {
          if (!isDisposed) renderCodeEnhancements()
        })
        .catch(err => {
          console.warn('[PrismMac] prism autoloader load failed:', err)
        })

      return true
    }

    if (!initCodeEnhancements() && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(initCodeEnhancements)
      observer.observe(document.body, { childList: true, subtree: true })
      initTimer = setTimeout(initCodeEnhancements, 1000)
    }

    return () => {
      isDisposed = true
      observer?.disconnect()
      newCodeBlocksObserver?.disconnect()
      if (initTimer) clearTimeout(initTimer)
      if (enhancementTimer) clearTimeout(enhancementTimer)
      closeCodeSidePanel()
      cleanupPrism()
    }
  }, [pathname, isDarkMode, blockMap])

  return <></>
}

const getNotionArticle = () => {
  const inArticleWrapper = document.querySelector('#article-wrapper #notion-article')
  if (inArticleWrapper) return inArticleWrapper

  const candidates = Array.from(document.querySelectorAll('#notion-article'))
  if (candidates.length <= 1) return candidates[0] || null

  // 多主题并存时可能有多个 notion-article，优先选择正文内容更完整的节点
  const score = el => {
    const codeCount = el.querySelectorAll('pre.notion-code, .code-toolbar').length
    const blockCount = el.querySelectorAll('.notion, .notion-page, .notion-text').length
    return codeCount * 10 + blockCount
  }

  return candidates.sort((a, b) => score(b) - score(a))[0] || null
}

const getNotionArticles = () => {
  const inArticleWrapper = Array.from(
    document.querySelectorAll('#article-wrapper #notion-article')
  )
  if (inArticleWrapper.length > 0) return inArticleWrapper

  return Array.from(document.querySelectorAll('#notion-article'))
}

const loadPrismMacStyleCSS = () => {
  const existing = document.querySelector(`link[href="${PRISM_MAC_STYLE_PATH}"]`)
  if (existing && existing.parentNode) {
    document.head.appendChild(existing)
    return Promise.resolve(PRISM_MAC_STYLE_PATH)
  }

  return loadExternalResource(PRISM_MAC_STYLE_PATH, 'css')
}

const CODE_SIDE_PANEL_ID = 'notion-code-side-panel'
const CODE_SIDE_PANEL_DESKTOP_QUERY = '(min-width: 1024px)'
const CODE_SIDE_PANEL_STATE = '__notionNextCodeSidePanelState'

export const isCodeSidePanelSupported = () => {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return true

  return window.matchMedia(CODE_SIDE_PANEL_DESKTOP_QUERY).matches
}

export const closeCodeSidePanel = () => {
  if (typeof document === 'undefined') return false

  const existing = document.getElementById(CODE_SIDE_PANEL_ID)
  if (existing) existing.remove()

  if (typeof window !== 'undefined') {
    const state = window[CODE_SIDE_PANEL_STATE]
    if (state?.keydownHandler) {
      document.removeEventListener('keydown', state.keydownHandler)
    }
    if (state?.desktopQuery && state.viewportHandler) {
      if (typeof state.desktopQuery.removeEventListener === 'function') {
        state.desktopQuery.removeEventListener('change', state.viewportHandler)
      } else {
        state.desktopQuery.removeListener?.(state.viewportHandler)
      }
    }
    if (state && document.body) {
      document.body.style.overflow = state.bodyOverflow
    }
    if (state && document.documentElement) {
      document.documentElement.style.overflow = state.documentOverflow
    }
    delete window[CODE_SIDE_PANEL_STATE]

    if (state?.returnFocus?.isConnected) {
      state.returnFocus.focus()
    }
  }

  return Boolean(existing)
}

const requestFrame = callback => {
  if (typeof window === 'undefined') return callback()

  const raf = window.requestAnimationFrame || (cb => window.setTimeout(cb, 0))
  return raf(callback)
}

export const openCodeSidePanel = ({
  language = '',
  lineCount = 0,
  codeClassName = '',
  codeHtml = '',
  text = ''
} = {}) => {
  if (typeof document === 'undefined' || !isCodeSidePanelSupported()) {
    return false
  }

  const returnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  closeCodeSidePanel()

  const root = document.createElement('div')
  root.id = CODE_SIDE_PANEL_ID
  root.className = 'code-side-panel-root'

  const backdrop = document.createElement('button')
  backdrop.type = 'button'
  backdrop.className = 'code-side-panel-backdrop'
  backdrop.setAttribute('aria-label', '关闭代码预览侧栏')
  backdrop.addEventListener('click', closeCodeSidePanel)

  const drawer = document.createElement('aside')
  drawer.className = 'code-side-panel-drawer'
  drawer.setAttribute('role', 'dialog')
  drawer.setAttribute('aria-label', '代码预览侧栏')
  drawer.setAttribute('aria-modal', 'true')

  const header = document.createElement('div')
  header.className = 'code-side-panel-header'

  const heading = document.createElement('div')
  heading.className = 'code-side-panel-heading'

  const title = document.createElement('div')
  title.className = 'code-side-panel-title'
  title.textContent = language ? language.toUpperCase() : 'CODE'

  const meta = document.createElement('div')
  meta.className = 'code-side-panel-meta'
  meta.textContent = lineCount ? `${lineCount} lines` : ''

  heading.appendChild(title)
  heading.appendChild(meta)

  const actions = document.createElement('div')
  actions.className = 'code-side-panel-actions'

  const copyButton = document.createElement('button')
  copyButton.type = 'button'
  copyButton.className = 'code-side-panel-copy'
  copyButton.textContent = '复制'
  const copyCode = async () => {
    const originalText = copyButton.textContent

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable')
      }
      await navigator.clipboard.writeText(text)
      copyButton.textContent = '已复制'
    } catch {
      copyButton.textContent = '复制失败'
    }

    window.setTimeout(() => {
      if (copyButton.isConnected) copyButton.textContent = originalText
    }, 1200)
  }
  copyButton.addEventListener('click', () => {
    void copyCode()
  })

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'code-side-panel-close'
  closeButton.setAttribute('aria-label', '关闭代码预览侧栏')
  closeButton.textContent = '关闭'
  closeButton.addEventListener('click', closeCodeSidePanel)

  actions.appendChild(copyButton)
  actions.appendChild(closeButton)
  header.appendChild(heading)
  header.appendChild(actions)

  const pre = document.createElement('pre')
  pre.className = 'code-side-panel-code'
  const code = document.createElement('code')
  code.className = codeClassName
  code.innerHTML = codeHtml
  pre.appendChild(code)

  drawer.appendChild(header)
  drawer.appendChild(pre)
  root.appendChild(backdrop)
  root.appendChild(drawer)

  const keydownHandler = event => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeCodeSidePanel()
      return
    }
    if (event.key !== 'Tab') return

    const activeElement = document.activeElement
    if (
      event.shiftKey &&
      (activeElement === copyButton || !drawer.contains(activeElement))
    ) {
      event.preventDefault()
      closeButton.focus()
    } else if (
      !event.shiftKey &&
      (activeElement === closeButton || !drawer.contains(activeElement))
    ) {
      event.preventDefault()
      copyButton.focus()
    }
  }
  const desktopQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia(CODE_SIDE_PANEL_DESKTOP_QUERY)
      : null
  const viewportHandler = event => {
    if (!event.matches) closeCodeSidePanel()
  }
  if (typeof desktopQuery?.addEventListener === 'function') {
    desktopQuery.addEventListener('change', viewportHandler)
  } else {
    desktopQuery?.addListener?.(viewportHandler)
  }
  window[CODE_SIDE_PANEL_STATE] = {
    bodyOverflow: document.body?.style.overflow || '',
    documentOverflow: document.documentElement?.style.overflow || '',
    desktopQuery,
    viewportHandler,
    keydownHandler,
    returnFocus
  }
  document.addEventListener('keydown', keydownHandler)
  if (document.body) document.body.style.overflow = 'hidden'
  if (document.documentElement) {
    document.documentElement.style.overflow = 'hidden'
  }

  document.body.appendChild(root)
  closeButton.focus()
  requestFrame(() => {
    if (root.isConnected) root.classList.add('is-open')
  })

  return true
}

const createCodeSidePanelButton = ({ language, label, lineCount, code }) => {
  if (!isCodeSidePanelSupported()) return null

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'collapse-side-panel-button'
  button.textContent = '在侧栏查看'
  button.setAttribute('aria-label', `在侧栏查看 ${label}`)
  button.addEventListener('click', event => {
    event.stopPropagation()
    openCodeSidePanel({
      language,
      lineCount,
      codeClassName: code.getAttribute('class') || '',
      codeHtml: code.innerHTML,
      text: code.textContent || ''
    })
  })

  return button
}

/**
 * 加载Prism主题样式
 */
const loadPrismThemeCSS = (
  isDarkMode,
  prismThemeSwitch,
  prismThemeDarkPath,
  prismThemeLightPath,
  prismThemePrefixPath
) => {
  let PRISM_THEME
  let PRISM_PREVIOUS
  if (prismThemeSwitch) {
    if (isDarkMode) {
      PRISM_THEME = prismThemeDarkPath
      PRISM_PREVIOUS = prismThemeLightPath
    } else {
      PRISM_THEME = prismThemeLightPath
      PRISM_PREVIOUS = prismThemeDarkPath
    }
    const previousTheme = document.querySelector(
      `link[href="${PRISM_PREVIOUS}"]`
    )
    if (
      previousTheme &&
      previousTheme.parentNode &&
      previousTheme.parentNode.contains(previousTheme)
    ) {
      previousTheme.parentNode.removeChild(previousTheme)
    }
    return loadExternalResource(PRISM_THEME, 'css')
  } else {
    return loadExternalResource(prismThemePrefixPath, 'css')
  }
}

/*
 * 将代码块转为可折叠对象
 */
export const renderCollapseCode = (codeCollapse, codeCollapseExpandDefault) => {
  if (!codeCollapse) {
    return
  }

  const COLLAPSE_MIN_LINES = Number(siteConfig('CODE_COLLAPSE_MIN_LINES', 20))
  const codeBlocks = document.querySelectorAll('.code-toolbar')

  for (const codeBlock of codeBlocks) {
    try {
      if (codeBlock.closest('.collapse-wrapper')) {
        continue
      }

      const code = codeBlock.querySelector('code')
      if (!code) {
        continue
      }

      const className = code.getAttribute('class') || ''
      const languageMatch = className.match(/language-([\w-]+)/)
      const language = languageMatch ? languageMatch[1] : ''

      const text = code.textContent || ''
      const lineCount = text ? text.split('\n').length : 0

      // 方案 C：仅当代码行数超过阈值时才启用折叠
      if (lineCount && lineCount < COLLAPSE_MIN_LINES) {
        continue
      }

      const parent = codeBlock.parentNode
      if (!parent || !parent.contains(codeBlock)) {
        continue
      }

      const collapseWrapper = document.createElement('div')
      collapseWrapper.className = 'collapse-wrapper w-full py-2'

      const panelWrapper = document.createElement('div')
      panelWrapper.className = 'collapse-panel-wrapper'

      const headerRow = document.createElement('div')
      headerRow.className = 'collapse-header-row'

      const header = document.createElement('button')
      header.type = 'button'
      header.className = 'collapse-header'

      const label = language
        ? `${language.toUpperCase()} · ${lineCount} lines`
        : `${lineCount} lines`

      header.innerHTML = `<span class="collapse-label">${label}</span><svg class="collapse-chevron" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.293 6.293a1 1 0 0 1 1.414 0L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z" clip-rule="evenodd"/></svg>`

      const panel = document.createElement('div')
      panel.className = 'collapse-panel'

      headerRow.appendChild(header)
      const sidePanelButton = createCodeSidePanelButton({
        language,
        label,
        lineCount,
        code
      })
      if (sidePanelButton) {
        headerRow.appendChild(sidePanelButton)
      }

      panelWrapper.appendChild(headerRow)
      panelWrapper.appendChild(panel)
      collapseWrapper.appendChild(panelWrapper)

      parent.insertBefore(collapseWrapper, codeBlock)
      panel.appendChild(codeBlock)

      function setExpanded(expanded) {
        panelWrapper.classList.toggle('is-expanded', expanded)
        panel.classList.toggle('is-expanded', expanded)
        header.setAttribute('aria-expanded', expanded ? 'true' : 'false')
        panel.style.maxHeight = expanded ? `${panel.scrollHeight}px` : '0px'
      }

      header.addEventListener('click', () => {
        const expanded = panelWrapper.classList.contains('is-expanded')
        setExpanded(!expanded)
      })

      setExpanded(Boolean(codeCollapseExpandDefault))
    } catch (err) {
      console.warn('[PrismMac] collapse code failed:', err)
    }
  }
}

/**
 * 代码块 id -> Notion 原文。复制时用原文，不从高亮后的 DOM 拼文字
 */
const buildRawCodeMap = blockMap => {
  const map = {}
  Object.values(blockMap?.block || {}).forEach(item => {
    const block = item?.value
    if (block?.type !== 'code' || !block.id) return
    map[block.id.replace(/-/g, '')] = (block.properties?.title || [])
      .map(segment => segment?.[0] || '')
      .join('')
  })
  return map
}

const CODE_ID_CLASS_PREFIX = 'notion-code-id-'

const CODE_LANGUAGE_NAMES = {
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  docker: 'Docker',
  go: 'Go',
  handlebars: 'Handlebars',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  kotlin: 'Kotlin',
  lua: 'Lua',
  markdown: 'Markdown',
  php: 'PHP',
  powershell: 'PowerShell',
  python: 'Python',
  shell: 'Shell',
  sql: 'SQL',
  typescript: 'TypeScript',
  xml: 'XML',
  yaml: 'YAML'
}

const getCodeLanguage = pre => {
  const match = (pre.className || '').match(/language-([\w#+-]+)/)
  return match ? match[1].toLowerCase() : ''
}

const getCodeLanguageLabel = language => {
  if (!language || ['plain', 'text', 'none', 'plaintext'].includes(language)) {
    return ''
  }
  return (
    CODE_LANGUAGE_NAMES[language] ||
    language.charAt(0).toUpperCase() + language.slice(1)
  )
}

const getRawCode = (pre, rawCodeById) => {
  const idClass = Array.from(pre.classList).find(name =>
    name.startsWith(CODE_ID_CLASS_PREFIX)
  )
  const raw = idClass && rawCodeById[idClass.slice(CODE_ID_CLASS_PREFIX.length)]
  if (typeof raw === 'string') return raw

  // 兜底：没有 block id 时取 code 文本，去掉行号插件插入的元素
  const code = pre.querySelector('code')
  if (!code) return ''
  const clone = code.cloneNode(true)
  clone.querySelectorAll('.line-numbers-rows').forEach(el => el.remove())
  return clone.textContent || ''
}

const writeClipboard = async text => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (e) {
      /* 回退到 execCommand */
    }
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-1000px'
  document.body.appendChild(textarea)
  textarea.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch (e) {
    copied = false
  }
  textarea.remove()
  return copied
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 把 pre 的 max-height 过渡到目标值；target 为 'none' 时展开到内容高度后放开限制
 */
const animateCodeHeight = (pre, target) => {
  const reduce = prefersReducedMotion()
  const finish = () => {
    if (target === 'none') pre.style.maxHeight = 'none'
  }
  if (reduce) {
    pre.style.maxHeight = target === 'none' ? 'none' : `${target}px`
    return
  }
  pre.style.maxHeight = `${pre.getBoundingClientRect().height}px`
  // 读一次布局，让起始高度生效后再改目标值，过渡才会发生
  void pre.offsetHeight
  pre.style.maxHeight = target === 'none' ? `${pre.scrollHeight}px` : `${target}px`
  const onEnd = event => {
    if (event.propertyName !== 'max-height') return
    pre.removeEventListener('transitionend', onEnd)
    finish()
  }
  pre.addEventListener('transitionend', onEnd)
}

const getFoldHeight = (pre, lines) => {
  const style = window.getComputedStyle(pre)
  const fontSize = parseFloat(style.fontSize) || 14
  const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5
  return Math.round((parseFloat(style.paddingTop) || 0) + lineHeight * lines)
}

const CHEVRON_ICON =
  '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z" clip-rule="evenodd"/></svg>'

/**
 * 统一代码框：在 Prism toolbar 生成的 div.code-toolbar 里加一条头部
 * （mac 圆点 + 语言名 + 复制 + 折叠），超过 minLines 行的代码默认收起到 minLines 行，
 * 底部渐隐并给出「展开全部（共 X 行）」。Prism 自带的 .toolbar 由主题样式隐藏。
 */
const renderCodeFrames = ({
  macBar,
  collapse,
  expandDefault,
  minLines,
  rawCodeById
}) => {
  const container = getNotionArticle()
  if (!container) return

  container.querySelectorAll('div.code-toolbar').forEach(wrapper => {
    try {
      if (wrapper.classList.contains('code-frame')) return
      const pre = wrapper.querySelector(':scope > pre')
      if (!pre) return
      const language = getCodeLanguage(pre)
      if (language === 'mermaid') return

      wrapper.classList.add('code-frame')
      const raw = getRawCode(pre, rawCodeById)
      const lineCount = raw.replace(/\n+$/, '').split('\n').length

      const head = document.createElement('div')
      head.className = 'code-frame-head'

      if (macBar) {
        const dots = document.createElement('span')
        dots.className = 'code-frame-dots'
        dots.setAttribute('aria-hidden', 'true')
        dots.innerHTML = '<span></span><span></span><span></span>'
        head.appendChild(dots)
      }

      const label = document.createElement('span')
      label.className = 'code-frame-lang'
      label.textContent = getCodeLanguageLabel(language)
      head.appendChild(label)

      const actions = document.createElement('div')
      actions.className = 'code-frame-actions'

      const copyButton = document.createElement('button')
      copyButton.type = 'button'
      copyButton.className = 'code-frame-copy'
      copyButton.textContent = '复制'
      let copyTimer = null
      copyButton.addEventListener('click', async () => {
        const copied = await writeClipboard(getRawCode(pre, rawCodeById))
        copyButton.textContent = copied ? '已复制' : '复制失败'
        copyButton.dataset.state = copied ? 'copied' : 'error'
        clearTimeout(copyTimer)
        copyTimer = setTimeout(() => {
          copyButton.textContent = '复制'
          delete copyButton.dataset.state
        }, 2000)
      })
      actions.appendChild(copyButton)
      head.appendChild(actions)
      wrapper.insertBefore(head, wrapper.firstChild)

      if (!collapse) return

      const foldable = lineCount > minLines
      let folded = foldable && !expandDefault
      let hidden = false
      const foldHeight = foldable ? getFoldHeight(pre, minLines) : 0

      let more = null
      let moreButton = null
      if (foldable) {
        more = document.createElement('div')
        more.className = 'code-frame-more'
        moreButton = document.createElement('button')
        moreButton.type = 'button'
        more.appendChild(moreButton)
        wrapper.appendChild(more)
      }

      const toggleButton = document.createElement('button')
      toggleButton.type = 'button'
      toggleButton.className = 'code-frame-toggle'
      toggleButton.innerHTML = CHEVRON_ICON
      actions.appendChild(toggleButton)

      const syncLabels = () => {
        wrapper.classList.toggle('is-folded', folded)
        wrapper.classList.toggle('is-hidden', hidden)
        toggleButton.setAttribute('aria-expanded', hidden ? 'false' : 'true')
        toggleButton.setAttribute('aria-label', hidden ? '展开代码' : '收起代码')
        toggleButton.title = hidden ? '展开代码' : '收起代码'
        if (moreButton) {
          moreButton.textContent = folded ? `展开全部（共 ${lineCount} 行）` : '收起'
          moreButton.setAttribute('aria-expanded', folded ? 'false' : 'true')
        }
      }

      const targetHeight = () => {
        if (hidden) return 0
        return folded ? foldHeight : 'none'
      }

      toggleButton.addEventListener('click', () => {
        hidden = !hidden
        syncLabels()
        animateCodeHeight(pre, targetHeight())
      })
      moreButton?.addEventListener('click', () => {
        const wasFolded = folded
        folded = !folded
        syncLabels()
        animateCodeHeight(pre, targetHeight())
        // 从展开收起时，把代码框拉回视口，避免停在下方空白处
        if (!wasFolded && wrapper.getBoundingClientRect().top < 0) {
          wrapper.scrollIntoView({
            block: 'start',
            behavior: prefersReducedMotion() ? 'auto' : 'smooth'
          })
        }
      })

      syncLabels()
      if (folded) pre.style.maxHeight = `${foldHeight}px`
    } catch (err) {
      console.warn('[PrismMac] code frame failed:', err)
    }
  })
}

/**
 * 将mermaid语言 渲染成图片
 */
const renderMermaid = mermaidCDN => {
  const articles = getNotionArticles()
  if (!articles || articles.length === 0) return () => {}

  let hasMermaidBlocks = false

  for (const article of articles) {
    const mermaidCodeBlocks = article.querySelectorAll(
      '.notion-code.language-mermaid'
    )
    for (const codeBlock of mermaidCodeBlocks) {
      const chart = codeBlock.querySelector('code')?.textContent
      if (!chart) continue
      hasMermaidBlocks = true
      let mermaidChart = codeBlock.querySelector('.mermaid')
      if (!mermaidChart) {
        mermaidChart = document.createElement('pre')
        mermaidChart.className = 'mermaid'
        mermaidChart.textContent = chart
        codeBlock.appendChild(mermaidChart)
      }
    }
  }

  if (!hasMermaidBlocks) return () => {}

  loadExternalResource(mermaidCDN, 'js')
    .then(() => {
      setTimeout(() => {
        try {
          const mermaid = window.mermaid
          if (!mermaid) return
          mermaid?.contentLoaded()
        } catch (err) {
          console.warn('[PrismMac] mermaid render failed:', err)
        }
      }, 60)
    })
    .catch(err => {
      console.warn('[PrismMac] mermaid load failed:', err)
    })

  return () => {}
}

function renderPrismMac(codeLineNumbers, codeMacBar) {
  const container = getNotionArticle()

  // Add line numbers
  if (codeLineNumbers) {
    const codeBlocks = container?.getElementsByTagName('pre')
    if (codeBlocks) {
      Array.from(codeBlocks).forEach(item => {
        if (!item.classList.contains('line-numbers')) {
          item.classList.add('line-numbers')
          item.style.whiteSpace = 'pre-wrap'
        }
      })
    }
  }
  // 重新渲染之前检查所有的多余text

  try {
    if (container && typeof Prism.highlightAllUnder === 'function') {
      Prism.highlightAllUnder(container)
    } else {
      Prism.highlightAll()
    }
  } catch (err) {
    console.warn('[PrismMac] prism highlight failed:', err)
  }

  const codeToolBars = container?.getElementsByClassName('code-toolbar')
  // Add pre-mac element for Mac Style UI
  if (codeMacBar && codeToolBars) {
    Array.from(codeToolBars).forEach(item => {
      try {
        const existPreMac = item.getElementsByClassName('pre-mac')
        if (existPreMac.length < 1) {
          const preMac = document.createElement('div')
          preMac.classList.add('pre-mac')
          preMac.innerHTML = '<span></span><span></span><span></span>'
          item.appendChild(preMac)
        }
      } catch (err) {
        console.warn('[PrismMac] pre-mac failed:', err)
      }
    })
  }

  // 折叠代码行号bug
  if (codeLineNumbers) {
    return fixCodeLineStyle()
  }
  return () => {}
}

/**
 * 行号样式在首次渲染或被detail折叠后行高判断错误
 * 在此手动resize计算
 */
const fixCodeLineStyle = () => {
  const article = getNotionArticle()
  if (!article) {
    return () => {}
  }

  if (!Prism?.plugins?.lineNumbers?.resize) {
    return () => {}
  }

  const observer = new MutationObserver(mutationsList => {
    for (const m of mutationsList) {
      if (m.target.nodeName === 'DETAILS') {
        const preCodes = m.target.querySelectorAll('pre.notion-code')
        for (const preCode of preCodes) {
          try {
            Prism.plugins.lineNumbers.resize(preCode)
          } catch (e) {
            /* ignore */
          }
        }
      }
    }
  })
  observer.observe(article, {
    attributes: true,
    subtree: true
  })
  const timeoutId = setTimeout(() => {
    const preCodes = article.querySelectorAll('pre.notion-code')
    for (const preCode of preCodes) {
      try {
        Prism.plugins.lineNumbers.resize(preCode)
      } catch (e) {
        /* ignore */
      }
    }
  }, 10)

  return () => {
    clearTimeout(timeoutId)
    observer.disconnect()
  }
}

export default PrismMac
