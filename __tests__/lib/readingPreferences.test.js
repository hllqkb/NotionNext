/**
 * @jest-environment node
 */
import {
  parseReadingPreferences,
  readStoredReadingPreferences,
  resolveReadingDefaults
} from '@/lib/readingPreferences'
import CONFIG from '@/themes/reading/config'

const defaults = {
  font: 'wenkai', theme: 'auto', size: 'm', leading: 'standard',
  width: 'standard', indent: 'off', align: 'start'
}

describe('阅读默认值', () => {
  it.each([
    ['缺少配置', undefined, defaults],
    ['空配置', {}, defaults],
    ['Notion 覆盖并去空格', {
      READING_DEFAULT_FONT: ' song ', READING_DEFAULT_THEME: ' green ',
      READING_DEFAULT_SIZE: ' l ', READING_DEFAULT_LEADING: ' loose ',
      READING_DEFAULT_WIDTH: ' wide ', READING_DEFAULT_INDENT: ' on ',
      READING_DEFAULT_ALIGN: ' justify '
    }, { font: 'song', theme: 'green', size: 'l', leading: 'loose', width: 'wide', indent: 'on', align: 'justify' }],
    ['逐项忽略非法值', {
      READING_DEFAULT_FONT: 'web', READING_DEFAULT_THEME: 'night',
      READING_DEFAULT_SIZE: 22, READING_DEFAULT_LEADING: '1.85',
      READING_DEFAULT_WIDTH: null, READING_DEFAULT_INDENT: true,
      READING_DEFAULT_ALIGN: 'middle'
    }, { ...defaults, theme: 'night' }]
  ])('%s', (_, config, expected) => {
    expect(resolveReadingDefaults(config)).toEqual(expected)
  })

  it.each(['song', '非法值', undefined])('主题配置兜底：%s', font => {
    const original = CONFIG.READING_DEFAULT_FONT
    try {
      CONFIG.READING_DEFAULT_FONT = font
      expect(resolveReadingDefaults({ READING_DEFAULT_FONT: 'invalid' }).font).toBe(font === 'song' ? 'song' : 'wenkai')
    } finally {
      CONFIG.READING_DEFAULT_FONT = original
    }
  })
})

describe('偏好校验', () => {
  it.each([
    ['坏 JSON', '{', null],
    ['空值', 'null', null],
    ['数组', '[1, "night"]', null],
    ['缺少版本', '{"theme":"night"}', null],
    ['未知版本', '{"v":2,"theme":"night"}', null],
    ['字符串版本', '{"v":"1","size":"l"}', null],
    ['空偏好', '{"v":1}', { v: 1 }],
    ['全部字段非法', '{"v":1,"font":"web","theme":"dark","size":"xl","leading":"1.85","width":680,"indent":true,"align":"left"}', { v: 1 }],
    ['逐项校验并忽略未知字段', '{"v":1,"font":"system","theme":"blue","size":"l","leading":2.05,"width":"wide","indent":"on","align":"end","extra":"x"}',
      { v: 1, font: 'system', size: 'l', width: 'wide', indent: 'on' }]
  ])('%s', (_, raw, expected) => {
    expect(parseReadingPreferences(raw)).toEqual(expected)
  })
})

const storageWith = entries => {
  const values = new Map(Object.entries(entries))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: jest.fn((key, value) => values.set(key, value)),
    removeItem: jest.fn(key => values.delete(key))
  }
}

describe('旧偏好迁移', () => {
  it.each([
    ['没有旧值也写迁移标记', {}, { v: 1 }],
    ['小号和 true', { 'reading-font-size': 's', darkMode: 'true' }, { v: 1, size: 's', theme: 'night' }],
    ['中号和 dark', { 'reading-font-size': 'm', darkMode: 'dark' }, { v: 1, size: 'm', theme: 'night' }],
    ['大号和 false', { 'reading-font-size': 'l', darkMode: 'false' }, { v: 1, size: 'l', theme: 'paper' }],
    ['light', { darkMode: 'light' }, { v: 1, theme: 'paper' }],
    ['忽略非法旧值', { 'reading-font-size': 'xl', darkMode: 'auto' }, { v: 1 }]
  ])('%s', (_, entries, expected) => {
    const storage = storageWith(entries)
    expect(readStoredReadingPreferences(storage)).toEqual({ overrides: expected, saved: true, protectedVersion: false })
    expect(JSON.parse(storage.getItem('reading-prefs'))).toEqual(expected)
    expect(storage.getItem('reading-font-size')).toBeNull()
    expect(storage.getItem('darkMode')).toBeNull()
    readStoredReadingPreferences(storage)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  it.each(['{"v":1}', '{"v":2,"font":"future"}', '{', '[]'])('已有记录不迁移或覆盖：%s', raw => {
    const storage = storageWith({ 'reading-prefs': raw, 'reading-font-size': 'l', darkMode: 'dark' })
    expect(readStoredReadingPreferences(storage).overrides).toEqual({ v: 1 })
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.removeItem).not.toHaveBeenCalled()
    expect(storage.getItem('reading-prefs')).toBe(raw)
  })

  it('迁移写入失败时保留旧值，并返回未保存状态', () => {
    const storage = storageWith({ 'reading-font-size': 'l', darkMode: 'dark' })
    storage.setItem.mockImplementation(() => { throw new Error('存储不可用') })
    expect(readStoredReadingPreferences(storage)).toEqual({ overrides: { v: 1, size: 'l', theme: 'night' }, saved: false, protectedVersion: false })
    expect(storage.removeItem).not.toHaveBeenCalled()
  })
})
