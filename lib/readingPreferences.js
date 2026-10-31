import BLOG from '@/blog.config'
import CONFIG from '@/themes/reading/config'

export const READING_PREFS_KEY = 'reading-prefs'
export const READING_PREFS_EVENT = 'reading-prefs-change'

// 第一项也是首屏脚本的硬编码兜底
export const READING_VALUES = {
  font: ['wenkai', 'song', 'hei', 'system'],
  theme: ['auto', 'paper', 'green', 'night', 'white', 'ink'],
  size: ['m', 's', 'l'],
  leading: ['standard', 'compact', 'loose'],
  width: ['standard', 'narrow', 'wide'],
  indent: ['off', 'on'],
  align: ['start', 'justify']
}

const fields = Object.keys(READING_VALUES)
const valid = (field, value) => READING_VALUES[field]?.includes(value)

/** 只读传入的 Notion 配置，不依赖全局上下文 */
export function resolveReadingDefaults(notionConfig) {
  return Object.fromEntries(fields.map(field => {
    const key = `READING_DEFAULT_${field.toUpperCase()}`
    const notion = typeof notionConfig?.[key] === 'string' ? notionConfig[key].trim() : notionConfig?.[key]
    const fallback = typeof CONFIG[key] === 'string' ? CONFIG[key].trim() : CONFIG[key]
    return [field, valid(field, notion) ? notion : valid(field, fallback) ? fallback : READING_VALUES[field][0]]
  }))
}

/** 无效记录返回 null；有效记录只留下已知字段 */
export function parseReadingPreferences(raw) {
  try {
    const value = JSON.parse(raw)
    if (!value || Array.isArray(value) || typeof value !== 'object' || value.v !== 1) return null
    return fields.reduce((prefs, field) => {
      if (valid(field, value[field])) prefs[field] = value[field]
      return prefs
    }, { v: 1 })
  } catch {
    return null
  }
}

/** 只有新记录不存在时才迁移；成功写入后再删旧记录 */
export function readStoredReadingPreferences(storage) {
  const prefs = { v: 1 }
  try {
    const raw = storage.getItem(READING_PREFS_KEY)
    if (raw !== null) {
      const parsed = parseReadingPreferences(raw)
      let value
      try { value = JSON.parse(raw) } catch {}
      return { overrides: parsed || prefs, saved: true, protectedVersion: value?.v !== 1 }
    }
    const size = storage.getItem('reading-font-size')
    const dark = storage.getItem('darkMode')
    if (valid('size', size)) prefs.size = size
    if (dark === 'true' || dark === 'dark') prefs.theme = 'night'
    if (dark === 'false' || dark === 'light') prefs.theme = 'paper'
    storage.setItem(READING_PREFS_KEY, JSON.stringify(prefs))
    storage.removeItem('reading-font-size')
    storage.removeItem('darkMode')
    return { overrides: prefs, saved: true, protectedVersion: false }
  } catch {
    return { overrides: prefs, saved: false, protectedVersion: false }
  }
}

const appearance = () => ({
  mode: BLOG.APPEARANCE || 'auto',
  hours: BLOG.APPEARANCE_DARK_TIME === false ? false : BLOG.APPEARANCE_DARK_TIME || [18, 6]
})

const resolveTheme = choice => {
  const query = window.location.search.match(/[?&]mode=(dark|light)(?:&|$)/)
  if (query) return query[1] === 'dark' ? 'night' : 'paper'
  if (choice !== 'auto') return choice
  const { mode, hours } = appearance()
  const hour = new Date().getHours()
  const dark = mode === 'dark' || (mode === 'auto' && (
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ||
    (hours && (hour >= hours[0] || hour < hours[1]))
  ))
  return dark ? 'night' : 'paper'
}

let current

const htmlDefaults = () => {
  const defaults = resolveReadingDefaults()
  try {
    const data = JSON.parse(document.documentElement.dataset.readingDefaults)
    fields.forEach(field => {
      if (valid(field, data?.[field])) defaults[field] = data[field]
    })
  } catch {}
  return defaults
}

/** 从首屏属性和浏览器记录接续状态，保存失败时保留本页选择 */
export function getReadingPreferences() {
  if (!current) {
    let stored
    try {
      stored = readStoredReadingPreferences(window.localStorage)
    } catch {
      stored = { overrides: { v: 1 }, saved: false, protectedVersion: false }
    }
    const defaults = htmlDefaults()
    const preferences = { ...defaults, ...stored.overrides }
    delete preferences.v
    if (!stored.saved) {
      fields.forEach(field => {
        const value = document.documentElement.getAttribute(`data-reading-${field === 'theme' ? 'choice' : field}`)
        if (valid(field, value)) preferences[field] = value
      })
    }
    current = { ...stored, defaults, preferences }
  }
  return { preferences: { ...current.preferences }, saved: current.saved }
}

// html 的配色、兼容 class 和事件只在这里一起更新
function applyReadingPreferences() {
  const state = getReadingPreferences()
  const html = document.documentElement
  fields.forEach(field => html.setAttribute(`data-reading-${field === 'theme' ? 'choice' : field}`, state.preferences[field]))
  const theme = resolveTheme(state.preferences.theme)
  html.dataset.readingTheme = theme
  html.classList.remove('dark', 'light')
  html.classList.add(theme === 'night' ? 'dark' : 'light')
  html.style.colorScheme = theme === 'night' ? 'dark' : 'light'
  window.dispatchEvent(new CustomEvent(READING_PREFS_EVENT, { detail: state }))
  return state
}

function savePreferences(reset = false) {
  try {
    // 不把未来版本降级；主动恢复默认才清空它
    if (current.protectedVersion && !reset) throw new Error('未知偏好版本')
    window.localStorage.setItem(READING_PREFS_KEY, JSON.stringify(current.overrides))
    current.protectedVersion = false
    window.localStorage.removeItem('reading-font-size')
    window.localStorage.removeItem('darkMode')
    current.saved = true
  } catch {
    current.saved = false
  }
}

export function setReadingPreference(field, value) {
  getReadingPreferences()
  if (!fields.includes(field) || !valid(field, value)) return getReadingPreferences()
  current.preferences[field] = value
  current.overrides[field] = value
  savePreferences()
  return applyReadingPreferences()
}

export const applyReadingTheme = choice => setReadingPreference('theme', choice)

export function resetReadingPreferences() {
  getReadingPreferences()
  current.defaults = htmlDefaults()
  current.overrides = { v: 1 }
  current.preferences = { ...current.defaults }
  savePreferences(true)
  return applyReadingPreferences()
}

/** 由全局上下文挂载一次，并负责卸载监听 */
export function initReadingPreferences() {
  applyReadingPreferences()
  const sync = event => {
    if (event.storageArea !== window.localStorage || (event.key !== READING_PREFS_KEY && event.key !== null)) return
    current = undefined
    applyReadingPreferences()
  }
  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  const followSystem = () => {
    if (getReadingPreferences().preferences.theme === 'auto') applyReadingPreferences()
  }
  window.addEventListener('storage', sync)
  media?.addEventListener('change', followSystem)
  return () => {
    window.removeEventListener('storage', sync)
    media?.removeEventListener('change', followSystem)
  }
}

/** ES5 首屏脚本：共享枚举，存储和默认属性分别兜底 */
export function getReadingInitScript() {
  const enums = Object.fromEntries(fields.map(field => [field, READING_VALUES[field].join('|')]))
  const { mode, hours } = appearance()
  const autoDark = mode === 'dark' ? 'true' : mode !== 'auto' ? 'false'
    : `(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)${hours ? `||(n>=${Number(hours[0])}||n<${Number(hours[1])})` : ''}`
  return `try{(function(){var h=document.documentElement,e=${JSON.stringify(enums)},d={},p={},k,t,s,n=new Date().getHours();try{d=JSON.parse(h.getAttribute('data-reading-defaults'))||{};if(typeof d!=='object')d={}}catch(x){}try{s=localStorage.getItem('${READING_PREFS_KEY}');if(s===null){p={v:1};t=localStorage.getItem('reading-font-size');if(e.size.split('|').indexOf(t)>=0)p.size=t;t=localStorage.getItem('darkMode');if(t==='true'||t==='dark')p.theme='night';if(t==='false'||t==='light')p.theme='paper';localStorage.setItem('${READING_PREFS_KEY}',JSON.stringify(p));localStorage.removeItem('reading-font-size');localStorage.removeItem('darkMode')}else p=JSON.parse(s)||{}}catch(x){}for(k in e){t=e[k].split('|');d[k]=t.indexOf(d[k])<0?t[0]:d[k];if(p.v===1&&t.indexOf(p[k])>=0)d[k]=p[k];h.setAttribute('data-reading-'+(k==='theme'?'choice':k),d[k])}t=d.theme;s=location.search.match(/[?&]mode=(dark|light)(?:&|$)/);if(s)t=s[1]==='dark'?'night':'paper';if(t==='auto')t=(${autoDark})?'night':'paper';h.setAttribute('data-reading-theme',t);s=t==='night'?'dark':'light';h.classList.remove('dark','light');h.classList.add(s);h.style.colorScheme=s;window.dispatchEvent(new CustomEvent('${READING_PREFS_EVENT}'))})()}catch(x){}`
}
