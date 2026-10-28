import { useEffect, useRef, useState } from 'react'

/** 三种装法：终端一行、Claude Code 会话里的斜杠命令、跨 agent 的 npx skills */
const MODES = [
  { key: 'cli', label: '终端' },
  { key: 'slash', label: '会话内' },
  { key: 'npx', label: 'npx skills' }
]

export const buildCommand = (mode, names, { repo, marketplace }) => {
  if (!names.length) return ''
  if (mode === 'slash') {
    return [`/plugin marketplace add ${repo}`, ...names.map(n => `/plugin install ${n}@${marketplace}`)].join('\n')
  }
  if (mode === 'npx') {
    return `npx skills add ${repo} ${names.map(n => `--skill ${n}`).join(' ')} -a claude-code -g`
  }
  return [`claude plugin marketplace add ${repo}`, ...names.map(n => `claude plugin install ${n}@${marketplace}`)].join(' && ')
}

const copyText = async text => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) {
    // 非 https 或权限被拒时退回 execCommand
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/** 复制按钮：点完两秒内显示「已复制」 */
const CopyButton = ({ text, label = '复制' }) => {
  const [done, setDone] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <button
      type='button'
      className='sk-copy'
      onClick={async () => {
        if (!(await copyText(text))) return
        setDone(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setDone(false), 2000)
      }}>
      <span aria-live='polite'>{done ? '已复制' : label}</span>
    </button>
  )
}

const ModeTabs = ({ mode, onChange, name }) => (
  <div className='sk-tabs' role='tablist' aria-label='安装方式'>
    {MODES.map(m => (
      <button
        key={m.key}
        type='button'
        role='tab'
        aria-selected={mode === m.key}
        aria-controls={`${name}-cmd`}
        className={mode === m.key ? 'active' : ''}
        onClick={() => onChange(m.key)}>
        {m.label}
      </button>
    ))}
  </div>
)

const SkillCard = ({ skill, selected, onToggle, mode, onMode, data }) => {
  const cmd = buildCommand(mode, [skill.name], data)
  return (
    <article className={`sk-card${selected ? ' selected' : ''}`}>
      <header className='sk-card-head'>
        <div>
          <h2>{skill.title}</h2>
          <code className='sk-name'>{skill.name}</code>
        </div>
        <label className='sk-pick'>
          <input type='checkbox' checked={selected} onChange={() => onToggle(skill.name)} />
          <span>{selected ? '已选' : '选中'}</span>
        </label>
      </header>
      <p className='sk-summary'>{skill.summary}</p>
      {skill.scenes?.length > 0 && (
        <ul className='sk-scenes' aria-label='适用场景'>
          {skill.scenes.map(s => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      {skill.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className='sk-shot' src={skill.image} alt={`${skill.title} 示例截图`} loading='lazy' />
      )}
      {skill.example && <p className='sk-example'>{skill.example}</p>}
      <ModeTabs mode={mode} onChange={onMode} name={skill.name} />
      <div className='sk-cmd' id={`${skill.name}-cmd`}>
        <pre>{cmd}</pre>
        <CopyButton text={cmd} />
      </div>
      <footer className='sk-links'>
        {skill.zip && (
          <a href={skill.zip} download>
            下载 zip<span>给 claude.ai 上传</span>
          </a>
        )}
        {skill.skillMd && (
          <a href={skill.skillMd} target='_blank' rel='noopener noreferrer'>
            查看 SKILL.md<span aria-hidden='true'>↗</span>
          </a>
        )}
      </footer>
    </article>
  )
}

/** Skills 页主体：卡片 + 多选后底部生成合并命令 */
export const SkillsBoard = ({ data }) => {
  const skills = data?.skills || []
  const [picked, setPicked] = useState([])
  const [mode, setMode] = useState('cli')
  const toggle = name => setPicked(p => (p.includes(name) ? p.filter(n => n !== name) : [...p, name]))
  // 合并命令按卡片顺序排，不按点选顺序
  const names = skills.map(s => s.name).filter(n => picked.includes(n))
  const merged = buildCommand(mode, names, data)

  return (
    <>
      <SkillsStyle />
      <header className='list-head'>
        <h1>
          Skills<span className='title-period'>。</span>
        </h1>
        <p className='intro-text'>我平时给 Claude 用的 skill，挑几个装上就能用。</p>
      </header>
      {data?.preview && <p className='sk-notice'>预览数据：仓库 {data.repo} 还没公开，命令和下载暂时只演示用法。</p>}
      <div className='collection-bar'>
        <p>共 {skills.length} 个 · 已选 {names.length} 个</p>
        <div className='sk-bar-actions'>
          <button type='button' onClick={() => setPicked(names.length === skills.length ? [] : skills.map(s => s.name))}>
            {names.length === skills.length ? '全不选' : '全选'}
          </button>
        </div>
      </div>
      <div className='sk-grid'>
        {skills.map(s => (
          <SkillCard key={s.name} skill={s} data={data} selected={picked.includes(s.name)} onToggle={toggle} mode={mode} onMode={setMode} />
        ))}
      </div>
      <section className='sk-howto' aria-labelledby='sk-howto-title'>
        <h2 id='sk-howto-title'>三种装法</h2>
        <dl>
          <dt>Claude Code 终端 / 会话内</dt>
          <dd>
            仓库是一个 plugin marketplace，先 <code>marketplace add</code> 再 <code>install</code>。装好的 skill 以 <code>/名字:名字</code> 调用。
            <a href='https://code.claude.com/docs/en/plugin-marketplaces' target='_blank' rel='noopener noreferrer'>官方文档</a>
          </dd>
          <dt>npx skills</dt>
          <dd>
            Vercel 的跨 agent 安装器，直接拷进 <code>~/.claude/skills/</code>，需要 Node 22.20+。
            <a href='https://github.com/vercel-labs/skills' target='_blank' rel='noopener noreferrer'>vercel-labs/skills</a>
          </dd>
          <dt>claude.ai</dt>
          <dd>
            下载 zip，在 Customize › Skills 点「+」上传；需先打开代码执行。
            <a href='https://support.claude.com/en/articles/12512180-use-skills-in-claude' target='_blank' rel='noopener noreferrer'>帮助文章</a>
          </dd>
        </dl>
      </section>
      {names.length > 0 && (
        <div className='sk-tray' role='region' aria-label='已选 skill 的合并安装命令'>
          <div className='sk-tray-inner'>
            <div className='sk-tray-head'>
              <span>已选 {names.length} 个：{names.join('、')}</span>
              <ModeTabs mode={mode} onChange={setMode} name='merged' />
              <button type='button' className='sk-clear' onClick={() => setPicked([])}>
                清空
              </button>
            </div>
            <div className='sk-cmd' id='merged-cmd'>
              <pre>{merged}</pre>
              <CopyButton text={merged} label='复制合并命令' />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const SkillsStyle = () => (
  <style jsx global>{`
    #theme-reading .sk-notice { margin: 0 0 18px; padding: 10px 14px; border-left: 2px solid var(--accent); background: var(--quote-bg); font-size: 15px; color: var(--muted); }
    #theme-reading .sk-bar-actions button,
    #theme-reading .sk-clear { background: none; border: 0; padding: 0; font: inherit; color: var(--accent); cursor: pointer; }
    #theme-reading .sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); gap: 28px; padding: 30px 0 10px; }
    #theme-reading .sk-card { display: flex; flex-direction: column; gap: 14px; min-width: 0; padding: 22px 24px; border: 1px solid var(--line); border-radius: 8px; transition: border-color .3s var(--ease); }
    #theme-reading .sk-card.selected { border-color: var(--accent); }
    #theme-reading .sk-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    #theme-reading .sk-card h2 { font-size: 26px; font-weight: 400; margin: 0 0 4px; }
    #theme-reading .sk-name { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: var(--muted); }
    #theme-reading .sk-pick { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--muted); cursor: pointer; white-space: nowrap; }
    #theme-reading .sk-pick input { accent-color: var(--accent); width: 16px; height: 16px; }
    #theme-reading .sk-summary { margin: 0; line-height: 1.8; }
    #theme-reading .sk-scenes { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
    #theme-reading .sk-scenes li { border: 1px solid var(--line); border-radius: 999px; padding: 2px 12px; font-size: 13px; color: var(--muted); }
    #theme-reading .sk-shot { width: 100%; border: 1px solid var(--line-soft); border-radius: 6px; }
    #theme-reading .sk-example { margin: 0; font-size: 15px; color: var(--muted); }
    #theme-reading .sk-example::before { content: '例 '; color: var(--accent); }
    #theme-reading .sk-tabs { display: flex; gap: 18px; font-size: 14px; border-bottom: 1px solid var(--line-soft); }
    #theme-reading .sk-tabs button { background: none; border: 0; padding: 0 0 6px; margin-bottom: -1px; font: inherit; color: var(--muted); cursor: pointer; border-bottom: 1px solid transparent; }
    #theme-reading .sk-tabs button.active { color: var(--ink); border-bottom-color: var(--accent); }
    #theme-reading .sk-cmd { position: relative; background: var(--code-bg); border-radius: 6px; }
    #theme-reading .sk-cmd pre { margin: 0; padding: 12px 84px 12px 14px; font: 13px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-all; color: var(--ink); }
    #theme-reading .sk-copy { position: absolute; top: 8px; right: 8px; border: 1px solid var(--line); border-radius: 4px; background: var(--paper); color: var(--ink); font: 13px/1.4 var(--font); padding: 3px 10px; cursor: pointer; }
    #theme-reading .sk-copy:hover { border-color: var(--accent); color: var(--accent); }
    #theme-reading .sk-links { display: flex; flex-wrap: wrap; gap: 22px; font-size: 15px; margin-top: auto; }
    #theme-reading .sk-links a { color: var(--accent); }
    #theme-reading .sk-links span { color: var(--muted); font-size: 13px; margin-left: 6px; }
    #theme-reading .sk-howto { padding: 30px 0 140px; border-top: 1px solid var(--line); margin-top: 30px; }
    #theme-reading .sk-howto h2 { font-size: 22px; font-weight: 400; margin: 0 0 16px; }
    #theme-reading .sk-howto dl { margin: 0; display: grid; grid-template-columns: 220px 1fr; gap: 12px 24px; font-size: 15px; }
    #theme-reading .sk-howto dt { color: var(--ink); }
    #theme-reading .sk-howto dd { margin: 0; color: var(--muted); line-height: 1.8; }
    #theme-reading .sk-howto dd a { color: var(--accent); margin-left: 8px; }
    #theme-reading .sk-howto code { font-size: 13px; background: var(--code-bg); padding: 1px 5px; border-radius: 3px; }
    #theme-reading .sk-tray { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; background: var(--paper); border-top: 1px solid var(--ink); box-shadow: 0 -8px 24px rgba(0, 0, 0, .06); }
    #theme-reading .sk-tray-inner { max-width: 1080px; margin: 0 auto; padding: 14px 56px 18px; display: flex; flex-direction: column; gap: 10px; }
    #theme-reading .sk-tray-head { display: flex; align-items: flex-end; gap: 24px; font-size: 14px; color: var(--muted); }
    #theme-reading .sk-tray-head > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #theme-reading .sk-tray .sk-tabs { border-bottom: 0; }
    @media (max-width: 520px) {
      #theme-reading .sk-card { padding: 18px 16px; }
      #theme-reading .sk-howto dl { grid-template-columns: 1fr; gap: 4px; }
      #theme-reading .sk-howto dd { margin-bottom: 12px; }
      #theme-reading .sk-tray-inner { padding: 12px 16px 16px; }
      #theme-reading .sk-tray-head { flex-wrap: wrap; gap: 8px 16px; }
      #theme-reading .sk-tray-head > span { flex-basis: 100%; }
    }
  `}</style>
)
