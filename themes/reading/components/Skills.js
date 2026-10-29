import { useState } from 'react'

/** 依次触发浏览器下载；间隔一点，避免被当成一次点击只下第一个 */
const downloadAll = async urls => {
  for (const url of urls) {
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
    await new Promise(r => setTimeout(r, 400))
  }
}

const SkillCard = ({ skill, selected, onToggle }) => (
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
    {skill.credit && (
      <p className='sk-credit'>
        第三方 skill，原作者 {skill.credit.author}，{skill.credit.license} 许可证。
        <a href={skill.credit.url} target='_blank' rel='noopener noreferrer'>
          原仓库<span aria-hidden='true'>↗</span>
        </a>
        <br />
        zip 里附原许可证和修改说明。
      </p>
    )}
    <p className='sk-install'>
      解压到 <code>~/.claude/skills/</code>，或者把 zip 上传到 claude.ai。
    </p>
    <footer className='sk-links'>
      <a href={skill.zip} download>
        下载 zip
      </a>
      <a href={skill.skillMd} target='_blank' rel='noopener noreferrer'>
        查看 SKILL.md<span aria-hidden='true'>↗</span>
      </a>
    </footer>
  </article>
)

/** Skills 页主体：卡片 + 多选后底部逐个下载 */
export const SkillsBoard = ({ data }) => {
  const skills = data?.skills || []
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)
  const toggle = name => setPicked(p => (p.includes(name) ? p.filter(n => n !== name) : [...p, name]))
  // 按卡片顺序，不按点选顺序
  const chosen = skills.filter(s => picked.includes(s.name))

  return (
    <>
      <SkillsStyle />
      <header className='list-head'>
        <h1>
          Skills<span className='title-period'>。</span>
        </h1>
        <p className='intro-text'>我平时给 Claude 用的 skill，下载 zip 就能装。</p>
      </header>
      <div className='collection-bar'>
        <p>
          共 {skills.length} 个 · 已选 {chosen.length} 个
        </p>
        <div className='sk-bar-actions'>
          <button type='button' onClick={() => setPicked(chosen.length === skills.length ? [] : skills.map(s => s.name))}>
            {chosen.length === skills.length ? '全不选' : '全选'}
          </button>
        </div>
      </div>
      <div className='sk-grid'>
        {skills.map(s => (
          <SkillCard key={s.name} skill={s} selected={picked.includes(s.name)} onToggle={toggle} />
        ))}
      </div>
      <section className='sk-howto' aria-labelledby='sk-howto-title'>
        <h2 id='sk-howto-title'>怎么装</h2>
        <dl>
          <dt>Claude Code</dt>
          <dd>
            把 zip 解压到 <code>~/.claude/skills/</code>，得到 <code>~/.claude/skills/名字/SKILL.md</code>，所有项目都能用；只想在一个项目里用就解压到项目的 <code>.claude/skills/</code>。
            <a href='https://code.claude.com/docs/en/skills' target='_blank' rel='noopener noreferrer'>官方文档</a>
          </dd>
          <dt>claude.ai</dt>
          <dd>
            在 Customize › Skills 点「+」，选 Upload a skill 上传 zip；需要先打开代码执行。
            <a href='https://support.claude.com/en/articles/12512180-use-skills-in-claude' target='_blank' rel='noopener noreferrer'>帮助文章</a>
          </dd>
        </dl>
      </section>
      {chosen.length > 0 && (
        <div className='sk-tray' role='region' aria-label='已选 skill'>
          <div className='sk-tray-inner'>
            <span>
              已选 {chosen.length} 个：{chosen.map(s => s.name).join('、')}
            </span>
            <button
              type='button'
              className='sk-download'
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await downloadAll(chosen.map(s => s.zip))
                setBusy(false)
              }}>
              {busy ? '下载中…' : `逐个下载 ${chosen.length} 个 zip`}
            </button>
            <button type='button' className='sk-clear' onClick={() => setPicked([])}>
              清空
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const SkillsStyle = () => (
  <style jsx global>{`
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
    #theme-reading .sk-credit { margin: 0; font-size: 14px; color: var(--muted); }
    #theme-reading .sk-credit a { color: var(--accent); margin-left: 6px; }
    #theme-reading .sk-install { margin: 0; padding-top: 12px; border-top: 1px solid var(--line-soft); font-size: 14px; color: var(--muted); }
    #theme-reading .sk-install code,
    #theme-reading .sk-howto code { font-size: 13px; background: var(--code-bg); padding: 1px 5px; border-radius: 3px; }
    #theme-reading .sk-links { display: flex; flex-wrap: wrap; gap: 22px; font-size: 15px; margin-top: auto; }
    #theme-reading .sk-links a { color: var(--accent); }
    #theme-reading .sk-links span { margin-left: 4px; }
    #theme-reading .sk-howto { padding: 30px 0 120px; border-top: 1px solid var(--line); margin-top: 30px; }
    #theme-reading .sk-howto h2 { font-size: 22px; font-weight: 400; margin: 0 0 16px; }
    #theme-reading .sk-howto dl { margin: 0; display: grid; grid-template-columns: 160px 1fr; gap: 12px 24px; font-size: 15px; }
    #theme-reading .sk-howto dt { color: var(--ink); }
    #theme-reading .sk-howto dd { margin: 0; color: var(--muted); line-height: 1.8; }
    #theme-reading .sk-howto dd a { color: var(--accent); margin-left: 8px; }
    #theme-reading .sk-tray { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; background: var(--paper); border-top: 1px solid var(--ink); box-shadow: 0 -8px 24px rgba(0, 0, 0, .06); }
    #theme-reading .sk-tray-inner { max-width: 1080px; margin: 0 auto; padding: 14px 56px; display: flex; align-items: center; gap: 24px; font-size: 14px; color: var(--muted); }
    #theme-reading .sk-tray-inner > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #theme-reading .sk-download { border: 1px solid var(--accent); border-radius: 4px; background: var(--accent); color: var(--paper); font: 14px/1.4 var(--font); padding: 6px 14px; cursor: pointer; white-space: nowrap; }
    #theme-reading .sk-download:disabled { opacity: .6; cursor: default; }
    @media (max-width: 520px) {
      #theme-reading .sk-card { padding: 18px 16px; }
      #theme-reading .sk-howto dl { grid-template-columns: 1fr; gap: 4px; }
      #theme-reading .sk-howto dd { margin-bottom: 12px; }
      #theme-reading .sk-tray-inner { padding: 12px 16px; flex-wrap: wrap; gap: 8px 16px; }
      #theme-reading .sk-tray-inner > span { flex-basis: 100%; }
    }
  `}</style>
)
