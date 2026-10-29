/**
 * 拉 GitHub 主页置顶的仓库，写到 data/pinned.json，给 /projects 页用。
 * 在 yarn export 的 next build 之前运行（Cloudflare Pages 的构建命令），每次构建刷新一次。
 * - 有 GITHUB_TOKEN 环境变量时走 GraphQL（星数精确，带项目主页）；
 * - 没有时读公开的 github.com/<用户> 主页 HTML，不需要任何密钥。
 * 拉取或解析失败、结果为空时都保留仓库里已有的 data/pinned.json，不让构建失败。
 */
import fs from 'node:fs'
import path from 'node:path'

const USER = process.env.PINNED_USER || 'hllqkb'
const FILE = path.join('data', 'pinned.json')
const TIMEOUT = 15000

const fetchText = async (url, init = {}) => {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.text()
}

/** GitHub 的 36.8k / 1.2m / 983 → 数字 */
const parseCount = text => {
  const m = String(text || '').trim().replace(/,/g, '').match(/^([\d.]+)\s*([km])?$/i)
  if (!m) return null
  return Math.round(parseFloat(m[1]) * ({ k: 1e3, m: 1e6 }[m[2]?.toLowerCase()] || 1))
}

const decode = s =>
  String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

async function fromGraphQL(token) {
  const query = `{user(login:"${USER}"){pinnedItems(first:6,types:REPOSITORY){nodes{... on Repository{
    name owner{login} url homepageUrl description stargazerCount isArchived primaryLanguage{name color}}}}}}`
  const body = JSON.parse(
    await fetchText('https://api.github.com/graphql', {
      method: 'POST',
      headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'notionnext-pinned' },
      body: JSON.stringify({ query })
    })
  )
  if (body.errors) throw new Error(JSON.stringify(body.errors))
  return body.data.user.pinnedItems.nodes.map(r => ({
    name: r.name,
    owner: r.owner.login,
    url: r.url,
    homepage: r.homepageUrl || null,
    description: r.description || '',
    language: r.primaryLanguage?.name || null,
    languageColor: r.primaryLanguage?.color || null,
    stars: r.stargazerCount,
    archived: r.isArchived
  }))
}

async function fromProfilePage() {
  const page = await fetchText(`https://github.com/${USER}`, { headers: { 'user-agent': 'Mozilla/5.0 (notionnext-pinned)' } })
  const items = page.match(/<li\s+class="[^"]*\bpinned-item-list-item\b[^"]*"[\s\S]*?<\/li>/g) || []
  return items
    .map(li => {
      const href = li.match(/href="\/([^/"]+)\/([^/"]+)"[^>]*class="[^"]*\bLink\b/)
      if (!href) return null
      const lang = li.match(/repo-language-color" style="background-color: ([^"]+)"[\s\S]*?itemprop="programmingLanguage">([^<]+)</)
      const stars = li.match(/\/stargazers"[\s\S]*?<\/svg>\s*([^<]+?)\s*<\/a>/)
      return {
        name: href[2],
        owner: href[1],
        url: `https://github.com/${href[1]}/${href[2]}`,
        homepage: null,
        description: decode(li.match(/<p class="pinned-item-desc[^"]*">([\s\S]*?)<\/p>/)?.[1]),
        language: lang ? decode(lang[2]) : null,
        languageColor: lang ? lang[1].trim() : null,
        stars: stars ? parseCount(stars[1]) : 0,
        archived: /Label[^>]*>\s*Public archive\s*</.test(li)
      }
    })
    .filter(Boolean)
}

async function main() {
  const token = process.env.GITHUB_TOKEN
  const source = token ? 'graphql' : 'profile-page'
  try {
    const items = token ? await fromGraphQL(token) : await fromProfilePage()
    if (!items.length || items.some(i => !i.name || !i.url)) throw new Error(`拿到 ${items.length} 个置顶，数据不完整`)
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify({ user: USER, source, fetchedAt: new Date().toISOString(), items }, null, 2) + '\n')
    console.log(`[pinned] ${source}: ${items.length} 个置顶 → ${FILE}`)
  } catch (e) {
    const kept = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : null
    console.warn(`[pinned] ${source} 拉取失败（${e.message}），沿用 ${kept ? `${kept.fetchedAt} 的 ${kept.items?.length} 个` : '空数据'}`)
  }
}

main()
