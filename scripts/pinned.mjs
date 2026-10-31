/**
 * 给 /projects 页拉 GitHub 数据，在 yarn export 的 next build 之前运行（Cloudflare Pages 的构建命令），每次构建刷新一次：
 * - data/repos.json：要展示的自己的仓库（REST /users/<用户>/repos，不需要密钥，未登录每小时 60 次）。
 *   博客仓库固定排第一、状态「进行中」；其余从非 fork 的公开仓库里按 star 降序取，star 相同按最近推送，状态「完成」；
 * - data/pinned.json：主页置顶。有 GITHUB_TOKEN 时走 GraphQL（星数精确，带项目主页），没有时读公开主页 HTML。
 * 有 GITHUB_TOKEN 时两个请求都带上它。任一份拉取或解析失败、结果为空时都保留仓库里已有的那份，不让构建失败。
 */
import fs from 'node:fs'
import path from 'node:path'

const USER = process.env.PINNED_USER || 'hllqkb'
const FILE = path.join('data', 'pinned.json')
const REPOS_FILE = path.join('data', 'repos.json')
const REPO_COUNT = 6
// 博客本身的仓库（NotionNext 的 fork）：固定展示，状态「进行中」
const BLOG_REPO = 'NotionNext'
const BLOG_HOMEPAGE = 'https://hllqk.cn'
const BLOG_DESCRIPTION = '就是这个博客：NotionNext 的 fork，自写 reading 主题，文章在 Notion 里写。'
// 其他博客类仓库（旧博客、Astro 版）也算「进行中」，但只在 star 排进前几名时出现
const BLOG_LIKE = /^(blog|hllqkblog|hllqkb\.github\.io|notionnext)$/i
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

// REST 不返回语言颜色，常见语言按 GitHub linguist 的颜色补上
const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Java: '#b07219', Go: '#00ADD8', 'C++': '#f34b7d', C: '#555555',
  'C#': '#178600', PHP: '#4F5D95', CSS: '#663399', HTML: '#e34c26', Vue: '#41b883', Stylus: '#ff6347', Astro: '#ff5a03',
  'Jupyter Notebook': '#DA5B0B', Shell: '#89e051', Kotlin: '#A97BFF', Rust: '#dea584', Dart: '#00B4AB', Lua: '#000080'
}

async function fromRest(token) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'notionnext-pinned', ...(token ? { authorization: `bearer ${token}` } : {}) }
  const list = JSON.parse(await fetchText(`https://api.github.com/users/${USER}/repos?type=owner&per_page=100`, { headers }))
  if (!Array.isArray(list)) throw new Error('返回的不是仓库列表')
  return list.map(r => ({
    name: r.name,
    owner: r.owner?.login || USER,
    url: r.html_url,
    homepage: r.homepage || null,
    description: r.description || '',
    language: r.language || null,
    languageColor: LANG_COLORS[r.language] || null,
    stars: r.stargazers_count || 0,
    fork: !!r.fork,
    archived: !!r.archived,
    pushedAt: r.pushed_at
  }))
}

/** 博客仓库 + 按 star 排的前几个，带上状态 */
const pickRepos = all => {
  const blog = all.find(r => r.name === BLOG_REPO)
  const ranked = all
    .filter(r => !r.fork && r.name !== USER && r.name !== BLOG_REPO)
    .sort((a, b) => b.stars - a.stars || String(b.pushedAt).localeCompare(String(a.pushedAt)))
  return [
    ...(blog ? [{ ...blog, description: BLOG_DESCRIPTION, homepage: BLOG_HOMEPAGE, language: blog.language || 'JavaScript', languageColor: LANG_COLORS[blog.language || 'JavaScript'] }] : []),
    ...ranked
  ]
    .slice(0, REPO_COUNT)
    .map(r => ({ ...r, status: r.name === BLOG_REPO || BLOG_LIKE.test(r.name) ? '进行中' : '完成' }))
}

async function syncRepos(token) {
  try {
    const items = pickRepos(await fromRest(token))
    if (!items.length || items.some(i => !i.name || !i.url)) throw new Error(`拿到 ${items.length} 个仓库，数据不完整`)
    fs.mkdirSync(path.dirname(REPOS_FILE), { recursive: true })
    fs.writeFileSync(REPOS_FILE, JSON.stringify({ user: USER, source: 'rest', fetchedAt: new Date().toISOString(), items }, null, 2) + '\n')
    console.log(`[repos] rest: ${items.length} 个仓库 → ${REPOS_FILE}`)
  } catch (e) {
    const kept = fs.existsSync(REPOS_FILE) ? JSON.parse(fs.readFileSync(REPOS_FILE, 'utf8')) : null
    console.warn(`[repos] 拉取失败（${e.message}），沿用 ${kept ? `${kept.fetchedAt} 的 ${kept.items?.length} 个` : '空数据'}`)
  }
}

async function syncPinned() {
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

syncRepos(process.env.GITHUB_TOKEN).then(syncPinned)
