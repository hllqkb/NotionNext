import pinned from '@/data/pinned.json'
import repos from '@/data/repos.json'
import { PageLink } from './Frame'

/**
 * GitHub 仓库卡片。data/repos.json（自己的仓库，博客 + 按 star 排）和 data/pinned.json（主页置顶）
 * 由 scripts/pinned.mjs 在每次 yarn export 前刷新，拉取失败时保留仓库里提交的那份，所以这里总有数据可用。
 */
export const myRepos = () => repos?.items || []
// 置顶里别人的仓库算「参与贡献」；自己的仓库已经在上面按 star 排过，不重复
export const pinnedRepos = () => (pinned?.items || []).filter(r => r.owner?.toLowerCase() !== String(pinned.user).toLowerCase())
const syncDay = data => String(data?.fetchedAt || '').slice(0, 10).replaceAll('-', '.')

/** 36779 → 3.7 万；983 → 983 */
const fmtStars = n => (n >= 10000 ? `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)} 万` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0))

const RepoCard = ({ r, tag, live, showOwner }) => (
  <li className='page-card project-card'>
    <div className='card-top'>
      <h3>
        {showOwner && <small className='repo-owner'>{r.owner} /</small>}
        {r.name}
      </h3>
      <span className={`status-tag${live ? ' live' : ''}`}>{tag}</span>
    </div>
    {r.description && <p className='card-desc'>{r.description}</p>}
    <p className='card-meta repo-meta'>
      {r.language && (
        <span>
          {r.language}
        </span>
      )}
      <span aria-label={`${r.stars} 颗星`}>{fmtStars(r.stars)} 星</span>
    </p>
    <p className='card-links'>
      <PageLink href={r.url}>
        仓库
      </PageLink>
      {r.homepage && (
        <PageLink href={r.homepage}>
          主页
        </PageLink>
      )}
    </p>
  </li>
)

/** 自己的仓库：博客固定第一（进行中），其余按 star 排（完成） */
export const MyRepos = () => {
  const items = myRepos()
  if (!items.length) return null
  return (
    <section className='pinned reveal' aria-label='我的项目'>
      <h2 className='section-label'>
        我的项目<span>{items.length}</span>
        <small>按 GitHub star 排 · 同步于 {syncDay(repos)}</small>
      </h2>
      <ul className='card-grid pinned-grid'>
        {items.map(r => (
          <RepoCard key={r.url} r={r} tag={r.status || '完成'} live={r.status === '进行中'} />
        ))}
      </ul>
    </section>
  )
}

/** 主页置顶里别人的仓库 */
export const PinnedRepos = () => {
  const items = pinnedRepos()
  if (!items.length) return null
  return (
    <section className='pinned reveal' aria-label='参与贡献的仓库'>
      <h2 className='section-label'>
        参与贡献<span>{items.length}</span>
        <small>GitHub 主页置顶 · 同步于 {syncDay(pinned)}</small>
      </h2>
      <ul className='card-grid pinned-grid'>
        {items.map(r => (
          <RepoCard key={r.url} r={r} tag={r.archived ? '已归档' : '参与贡献'} showOwner />
        ))}
      </ul>
    </section>
  )
}
