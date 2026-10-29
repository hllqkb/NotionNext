import pinned from '@/data/pinned.json'
import { PageLink } from './Frame'

/**
 * GitHub 主页置顶的仓库。data/pinned.json 由 scripts/pinned.mjs 在每次 yarn export 前刷新，
 * 拉取失败时保留仓库里提交的那份，所以这里总有数据可用。
 */
export const pinnedRepos = () => pinned?.items || []

/** 36779 → 3.7 万；983 → 983 */
const fmtStars = n => (n >= 10000 ? `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)} 万` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0))

export const PinnedRepos = ({ user }) => {
  const items = pinnedRepos()
  if (!items.length) return null
  const day = String(pinned.fetchedAt || '').slice(0, 10).replaceAll('-', '.')
  return (
    <section className='pinned reveal' aria-label='GitHub 置顶仓库'>
      <h2 className='section-label'>
        GitHub 置顶<span>{items.length}</span>
        {day && <small>同步于 {day}</small>}
      </h2>
      <ul className='card-grid pinned-grid'>
        {items.map(r => {
          const mine = r.owner?.toLowerCase() === String(user || pinned.user).toLowerCase()
          return (
            <li key={r.url} className='page-card project-card'>
              <div className='card-top'>
                <h3>
                  {!mine && <small className='repo-owner'>{r.owner} /</small>}
                  {r.name}
                </h3>
                <span className={`status-tag${mine ? ' live' : ''}`}>{r.archived ? '已归档' : mine ? '自己的' : '参与贡献'}</span>
              </div>
              {r.description && <p className='card-desc'>{r.description}</p>}
              <p className='card-meta repo-meta'>
                {r.language && (
                  <span>
                    <i className='lang-dot' style={{ background: r.languageColor || 'var(--muted)' }} aria-hidden='true' />
                    {r.language}
                  </span>
                )}
                <span aria-label={`${r.stars} 颗星`}>★ {fmtStars(r.stars)}</span>
              </p>
              <p className='card-links'>
                <PageLink href={r.url}>
                  仓库<span aria-hidden='true'>↗</span>
                </PageLink>
                {r.homepage && (
                  <PageLink href={r.homepage}>
                    主页<span aria-hidden='true'>↗</span>
                  </PageLink>
                )}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
