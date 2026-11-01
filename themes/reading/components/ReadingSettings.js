import {
  getReadingPreferences,
  READING_PREFS_EVENT,
  resetReadingPreferences,
  setReadingPreference
} from '@/lib/readingPreferences'
import { useEffect, useRef, useState } from 'react'

// 预览只用本机字体，打开面板不触发文楷下载
const previewFonts = {
  wenkai: "'Kaiti SC', STKaiti, KaiTi, 'Songti SC', SimSun, serif",
  song: "'Songti SC', STSong, SimSun, 'Noto Serif CJK SC', 'Source Han Serif SC', serif",
  hei: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Source Han Sans SC', sans-serif",
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
}
const groups = [
  ['theme', '配色', [['auto', '跟随系统'], ['paper', '纸色'], ['green', '浅绿'], ['night', '夜间'], ['white', '纯白'], ['ink', '墨水屏']]],
  ['font', '字体', [['wenkai', '文楷'], ['song', '宋体（本机）'], ['hei', '黑体（本机）'], ['system', '系统']]],
  ['size', '字号', [['s', '小'], ['m', '中'], ['l', '大']]],
  ['leading', '行距', [['compact', '紧凑'], ['standard', '标准'], ['loose', '宽松']]],
  ['width', '版心', [['narrow', '窄'], ['standard', '标准'], ['wide', '宽']]]
]

/** 首次点击后挂载：桌面非模态，手机使用原生模态抽屉 */
export default function ReadingSettings({ triggerRef, onClose }) {
  const dialogRef = useRef(null)
  const [state, setState] = useState(getReadingPreferences)

  useEffect(() => {
    const dialog = dialogRef.current
    const mobile = window.matchMedia('(max-width: 520px)')
    const show = () => {
      if (mobile.matches) dialog.showModal()
      else dialog.show()
    }
    const close = () => dialog.close()
    const outside = event => {
      if (triggerRef.current?.contains(event.target)) return
      if (!dialog.contains(event.target)) close()
      // 模态背景的事件目标也是 dialog
      else if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
      }
    }
    const escape = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    const finish = () => {
      if (dialog.open) return
      onClose()
      triggerRef.current?.focus({ preventScroll: true })
    }
    const sync = () => setState(getReadingPreferences())
    show()
    dialog.addEventListener('close', finish)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    mobile.addEventListener('change', close)
    window.addEventListener(READING_PREFS_EVENT, sync)
    return () => {
      dialog.removeEventListener('close', finish)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
      mobile.removeEventListener('change', close)
      window.removeEventListener(READING_PREFS_EVENT, sync)
      dialog.close()
    }
  }, [triggerRef, onClose])

  const choose = (field, value) => setState(setReadingPreference(field, value))
  return (
    <dialog ref={dialogRef} id='reading-settings' className='reading-settings' aria-labelledby='reading-settings-title'>
      <div className='reading-settings-head'>
        <h2 id='reading-settings-title'>阅读设置</h2>
        <button type='button' onClick={() => dialogRef.current.close()} autoFocus>关闭</button>
      </div>
      {groups.map(([field, label, options]) => (
        <fieldset key={field}>
          <legend>{label}</legend>
          <div className={`reading-options reading-options-${field}`}>
            {options.map(([value, text]) => (
              <label key={value} className='reading-option'>
                <input type='radio' name={`reading-${field}`} value={value} checked={state.preferences[field] === value} onChange={() => choose(field, value)} />
                <span style={field === 'font' ? { fontFamily: previewFonts[value] } : undefined}>{text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <fieldset>
        <legend>段落</legend>
        <div className='reading-options reading-paragraph'>
          {[['indent', '首行缩进', 'on', 'off'], ['align', '两端对齐', 'justify', 'start']].map(([field, label, on, off]) => (
            <label key={field} className='reading-option'>
              <input type='checkbox' checked={state.preferences[field] === on} onChange={event => choose(field, event.target.checked ? on : off)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className='reading-settings-reset' type='button' onClick={() => setState(resetReadingPreferences())}>恢复站点默认</button>
      <p className='reading-settings-note'>设置仅保存在当前浏览器</p>
      <p className='reading-settings-status' role='status'>{state.saved ? '' : '本次设置未能保存'}</p>
    </dialog>
  )
}
