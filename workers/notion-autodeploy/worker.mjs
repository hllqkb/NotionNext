// Poll the blog's Notion database on a cron and POST the Cloudflare Pages
// Deploy Hook once edits have been quiet for QUIET_MINUTES.

const STATE_KEY = 'state'
const NOTION_VERSION = '2025-09-03'
// Daily build cap counts days in UTC+8, so the reset lands at Beijing midnight.
const DAY_OFFSET_MS = 8 * 60 * 60 * 1000

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      check(env, controller.scheduledTime).then(result =>
        console.log(JSON.stringify(result))
      )
    )
  },

  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (request.method !== 'GET' || pathname !== '/status') {
      return new Response('Not found', { status: 404 })
    }
    const state = await env.STATE.get(STATE_KEY, 'json')
    return Response.json({ state })
  }
}

export async function check(env, nowMs) {
  const now = new Date(nowMs)
  const state = await env.STATE.get(STATE_KEY, 'json')

  // First run: start watching from now instead of rebuilding for old edits.
  if (!state) {
    await env.STATE.put(
      STATE_KEY,
      JSON.stringify({ cutoff: now.toISOString(), day: dayOf(now), count: 0 })
    )
    return { action: 'init', cutoff: now.toISOString() }
  }

  const latest = await latestRelevantEdit(env, state.cutoff)
  if (!latest) return { action: 'no-change', cutoff: state.cutoff }

  const quietMs = Number(env.QUIET_MINUTES || 10) * 60 * 1000
  if (nowMs - Date.parse(latest) < quietMs) {
    return { action: 'waiting', latest }
  }

  const day = dayOf(now)
  const count = state.day === day ? state.count : 0
  const cap = Number(env.MAX_BUILDS_PER_DAY || 6)
  if (count >= cap) return { action: 'capped', latest, count }

  const res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' })
  if (!res.ok) {
    // Leave state alone so the next tick retries.
    throw new Error(`Deploy hook failed: ${res.status} ${await res.text()}`)
  }

  await env.STATE.put(
    STATE_KEY,
    JSON.stringify({
      cutoff: latest,
      lastBuildAt: now.toISOString(),
      day,
      count: count + 1
    })
  )
  return { action: 'deployed', latest, count: count + 1 }
}

// Newest last_edited_time after cutoff among pages whose status is not ignored.
async function latestRelevantEdit(env, cutoff) {
  const ignored = new Set(
    (env.IGNORE_STATUSES ?? 'Draft')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
  const statusProp = env.STATUS_PROPERTY || 'status'
  const dataSourceId = env.NOTION_DATA_SOURCE_ID || (await resolveDataSource(env))

  const url = new URL(`${apiBase(env)}/v1/data_sources/${dataSourceId}/query`)
  url.searchParams.append('filter_properties[]', statusProp)
  const res = await fetch(url, {
    method: 'POST',
    headers: notionHeaders(env),
    body: JSON.stringify({
      filter: {
        timestamp: 'last_edited_time',
        last_edited_time: { after: cutoff }
      },
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
      page_size: 50
    })
  })
  if (!res.ok) {
    throw new Error(`Notion query failed: ${res.status} ${await res.text()}`)
  }
  const { results } = await res.json()

  for (const page of results) {
    const prop = page.properties?.[statusProp]
    const status = prop?.select?.name ?? prop?.status?.name ?? ''
    // Results are sorted newest first, so the first relevant one wins.
    if (!ignored.has(status) && Date.parse(page.last_edited_time) > Date.parse(cutoff)) {
      return page.last_edited_time
    }
  }
  return null
}

async function resolveDataSource(env) {
  const res = await fetch(
    `${apiBase(env)}/v1/databases/${env.NOTION_DATABASE_ID}`,
    { headers: notionHeaders(env) }
  )
  if (!res.ok) {
    throw new Error(`Notion database lookup failed: ${res.status} ${await res.text()}`)
  }
  const { data_sources: sources } = await res.json()
  if (!sources?.length) throw new Error('Notion database has no data source')
  return sources[0].id
}

function notionHeaders(env) {
  return {
    Authorization: `Bearer ${env.NOTION_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json'
  }
}

function apiBase(env) {
  return env.NOTION_API_BASE || 'https://api.notion.com'
}

function dayOf(date) {
  return new Date(date.getTime() + DAY_OFFSET_MS).toISOString().slice(0, 10)
}
