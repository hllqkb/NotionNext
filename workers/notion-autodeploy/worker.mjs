// Poll the blog's Notion database on a cron and POST the Cloudflare Pages
// Deploy Hook when the live site is out of date: published pages edited and
// quiet for QUIET_MINUTES, config rows edited, pages unpublished or deleted,
// or scheduled pages whose date has arrived. A build only counts once the site's RSS
// lastBuildDate shows it finished; otherwise it is retried.

const STATE_KEY = 'state'
const NOTION_VERSION = '2025-09-03'
const MINUTE_MS = 60 * 1000
// Daily build cap counts days in UTC+8, so the reset lands at Beijing midnight.
const DAY_OFFSET_MS = 8 * 60 * MINUTE_MS

// Keep each database's data source separate in warm isolates.
const dataSourcesByDatabase = new Map()

export default {
  async scheduled(controller, env, ctx) {
    const at = new Date(controller.scheduledTime).toISOString()
    const configError = checkConfig(env)
    if (configError) {
      console.error(JSON.stringify({ at, action: 'config-error', error: configError }))
      return
    }
    ctx.waitUntil(
      check(env, controller.scheduledTime).then(
        result => console.log(JSON.stringify(result)),
        error => {
          // Errors can carry request URLs or response bodies; never log them raw.
          const message = redact(env, error)
          console.error(JSON.stringify({ at, action: 'error', error: message }))
          throw new Error(message)
        }
      )
    )
  },

  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (request.method !== 'GET' || pathname !== '/status') {
      return new Response('Not found', { status: 404 })
    }
    const state = await env.STATE.get(STATE_KEY, 'json')
    // Page ids and dates stay private: unpublished drafts may be among them.
    return Response.json({
      configError: checkConfig(env),
      state: state && {
        cutoff: state.cutoff,
        lastBuildAt: state.lastBuildAt,
        day: state.day,
        count: state.count,
        liveCount: state.live ? Object.keys(state.live).length : null,
        pending: state.pending
          ? { hookAt: state.pending.hookAt, reasons: state.pending.reasons }
          : null
      }
    })
  }
}

export async function check(env, nowMs) {
  const now = new Date(nowMs)
  const at = now.toISOString()
  const state = await env.STATE.get(STATE_KEY, 'json')

  // First run, or state from the version without a live-page snapshot:
  // record what is online now instead of rebuilding for old edits.
  if (!state?.live) {
    const live = await scanLive(env)
    const next = {
      cutoff: state?.cutoff ?? at,
      lastBuildAt: state?.lastBuildAt ?? state?.cutoff ?? at,
      day: state?.day ?? dayOf(now),
      count: state?.count ?? 0,
      live
    }
    await save(env, next)
    return { at, action: 'init', cutoff: next.cutoff, live: Object.keys(live).length }
  }

  if (state.pending) {
    const { pending } = state
    const builtAt = await siteBuiltAt(env)
    if (builtAt !== null && builtAt >= Date.parse(pending.hookAt)) {
      await save(env, {
        cutoff: pending.cutoff,
        lastBuildAt: pending.hookAt,
        day: state.day,
        count: state.count,
        live: pending.live
      })
      return { at, action: 'confirmed', builtAt: new Date(builtAt).toISOString() }
    }
    const confirmMs = Number(env.CONFIRM_MINUTES || 60) * MINUTE_MS
    if (nowMs - Date.parse(pending.hookAt) < confirmMs) {
      return { at, action: 'building', hookAt: pending.hookAt }
    }
    // No finished build showed up in time: post the hook again for the same
    // changes. At the daily cap, drop it; the changes are found again later.
    const { day, count } = todayCount(state, now)
    if (count >= buildCap(env)) {
      await save(env, { ...state, pending: null })
      return { at, action: 'build-timeout', hookAt: pending.hookAt, count }
    }
    await postHook(env)
    await save(env, { ...state, day, count: count + 1, pending: { ...pending, hookAt: at } })
    return { at, action: 'retried', reasons: pending.reasons, count: count + 1 }
  }

  const liveStatuses = statusSet(env)
  const lastBuildMs = Date.parse(state.lastBuildAt)
  const reasons = []

  // Edits since the last build to pages that are live, or were live at the
  // last build (Published -> Draft is an edit to a page in state.live).
  let latest = null
  for (const page of await editedSince(env, state.cutoff)) {
    if (!liveStatuses.has(page.status) && !(page.id in state.live)) continue
    if (!latest || Date.parse(page.edited) > Date.parse(latest)) latest = page.edited
  }
  if (latest) reasons.push('edited')

  // Inline database edits do not update the parent page's edit time.
  let config = 'skipped'
  if (env.CONFIG_DATABASE_ID) {
    try {
      const edited = await configEditedSince(env, state.cutoff)
      config = 'ok'
      if (edited) {
        reasons.push('config')
        if (!latest || Date.parse(edited) > Date.parse(latest)) latest = edited
      }
    } catch (error) {
      // Config access failures must not block article updates.
      config = 'failed'
      console.warn(JSON.stringify({ at, action: 'config-query-failed', error: redact(env, error) }))
    }
  }
  const quietMs = Number(env.QUIET_MINUTES || 10) * MINUTE_MS
  if (latest && nowMs - Date.parse(latest) < quietMs) {
    return { at, action: 'waiting', latest, config }
  }

  // Scheduled pages that were held back at the last build and are due now.
  if (Object.values(state.live).some(start => start > lastBuildMs && start <= nowMs)) {
    reasons.push('scheduled')
  }

  // Deleted pages never show up as edits, so once an hour compare the full
  // list of live pages with the last build.
  let live = null
  if (now.getUTCMinutes() < 5) {
    live = await scanLive(env)
    const removed = Object.entries(state.live).some(
      ([id, start]) => !(id in live) && start <= lastBuildMs
    )
    if (removed) reasons.push('removed')
  }

  if (!reasons.length) return { at, action: 'no-change', cutoff: state.cutoff, config }

  const { day, count } = todayCount(state, now)
  if (count >= buildCap(env)) return { at, action: 'capped', reasons, count, config }

  // Snapshot before the hook: anything changed after this is newer than the
  // build and gets picked up next time.
  live ??= await scanLive(env)
  await postHook(env)

  const pending = { hookAt: at, reasons, cutoff: latest ?? state.cutoff, live }
  if (!env.SITE_URL) {
    // Nothing to confirm against: treat the accepted hook as the build.
    await save(env, {
      cutoff: pending.cutoff,
      lastBuildAt: at,
      day,
      count: count + 1,
      live
    })
  } else {
    await save(env, { ...state, day, count: count + 1, pending })
  }
  return { at, action: 'deployed', reasons, latest, count: count + 1, config }
}

async function postHook(env) {
  let res
  try {
    res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' })
  } catch (error) {
    throw new Error(
      error instanceof TypeError && /invalid url/i.test(error.message)
        ? 'invalid DEPLOY_HOOK_URL (not an https URL)'
        : 'Deploy hook request failed'
    )
  }
  if (!res.ok) {
    // Throwing leaves state alone, so the next tick retries.
    throw new Error(`Deploy hook failed: ${res.status} ${await res.text()}`)
  }
}

// Shape checks only, so a secret pasted into the wrong slot is caught before
// it is sent anywhere. Messages never include the values.
function checkConfig(env) {
  const errors = []
  if (!env.DEPLOY_HOOK_URL?.startsWith('https://api.cloudflare.com/')) {
    errors.push('DEPLOY_HOOK_URL must start with https://api.cloudflare.com/')
  }
  if (!/^(ntn_|secret_)/.test(env.NOTION_TOKEN ?? '')) {
    errors.push('NOTION_TOKEN must start with ntn_ or secret_')
  }
  return errors.length ? errors.join('; ') : null
}

// Error text with every secret value, and anything shaped like one, removed.
function redact(env, error) {
  let text = String(error?.message ?? error)
  if (/invalid url/i.test(text)) return 'invalid URL (value not logged)'
  for (const secret of [env.NOTION_TOKEN, env.DEPLOY_HOOK_URL]) {
    if (secret) text = text.split(secret).join('[redacted]')
  }
  return text
    .replace(/\b(ntn_|secret_)\w+/g, '$1[redacted]')
    .replace(/deploy_hooks\/[\w-]+/g, 'deploy_hooks/[redacted]')
}

function todayCount(state, now) {
  const day = dayOf(now)
  return { day, count: state.day === day ? state.count : 0 }
}

function buildCap(env) {
  return Number(env.MAX_BUILDS_PER_DAY || 6)
}

// Pages edited after cutoff, newest first.
async function editedSince(env, cutoff) {
  const { results } = await queryPages(env, {
    filter: {
      timestamp: 'last_edited_time',
      last_edited_time: { after: cutoff }
    },
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    page_size: 100
  })
  return results
    .map(page => readPage(env, page))
    .filter(page => Date.parse(page.edited) > Date.parse(cutoff))
}

// Config rows have no status/date columns; every row edit counts.
async function configEditedSince(env, cutoff) {
  const dataSourceId = env.CONFIG_DATA_SOURCE_ID ||
    (await resolveDataSource(env, env.CONFIG_DATABASE_ID))
  const res = await fetch(`${apiBase(env)}/v1/data_sources/${dataSourceId}/query`, {
    method: 'POST',
    headers: notionHeaders(env),
    body: JSON.stringify({
      filter: {
        timestamp: 'last_edited_time',
        last_edited_time: { after: cutoff }
      },
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
      page_size: 1
    })
  })
  if (!res.ok) {
    throw new Error(`Notion config query failed: ${res.status} ${await res.text()}`)
  }
  const { results } = await res.json()
  const edited = results[0]?.last_edited_time
  return Date.parse(edited) > Date.parse(cutoff) ? edited : null
}

// Every page with a live status, as { pageId: publishTimeMs }. Trashed pages
// are not returned by the query, so they drop out of this map.
async function scanLive(env) {
  const liveStatuses = statusSet(env)
  const live = {}
  let cursor
  do {
    const body = { page_size: 100 }
    if (cursor) body.start_cursor = cursor
    const data = await queryPages(env, body)
    for (const page of data.results) {
      const { id, status, start } = readPage(env, page)
      if (liveStatuses.has(status)) live[id] = start
    }
    cursor = data.has_more ? data.next_cursor : null
  } while (cursor)
  return live
}

async function queryPages(env, body) {
  const dataSourceId = env.NOTION_DATA_SOURCE_ID || (await resolveDataSource(env))
  const url = new URL(`${apiBase(env)}/v1/data_sources/${dataSourceId}/query`)
  url.searchParams.append('filter_properties[]', statusProperty(env))
  url.searchParams.append('filter_properties[]', dateProperty(env))
  const res = await fetch(url, {
    method: 'POST',
    headers: notionHeaders(env),
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    // 429 included: the next tick is the retry.
    throw new Error(`Notion query failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

function readPage(env, page) {
  const status = page.properties?.[statusProperty(env)]
  return {
    id: page.id,
    edited: page.last_edited_time,
    status: status?.select?.name ?? status?.status?.name ?? '',
    start: startMs(page.properties?.[dateProperty(env)]?.date)
  }
}

// Same rule as isScheduledInFuture in lib/db/SiteDataApi.js: a date without
// a time means 00:00, and times without an offset are Asia/Shanghai.
// Pages without a date count as published since forever (0).
function startMs(date) {
  if (!date?.start) return 0
  let start = date.start
  if (start.length === 10) start += 'T00:00:00'
  if (!/(Z|[+-]\d\d:\d\d)$/.test(start)) start += '+08:00'
  return Date.parse(start) || 0
}

// lastBuildDate of the site's RSS feed is written during the build, so it
// tells when the newest production build finished. Null when unknown.
async function siteBuiltAt(env) {
  try {
    const url = new URL('/rss/feed.xml', env.SITE_URL)
    url.searchParams.set('t', Date.now())
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } })
    if (!res.ok) return null
    const match = /<lastBuildDate>([^<]+)<\/lastBuildDate>/.exec(await res.text())
    return match ? Date.parse(match[1]) || null : null
  } catch (error) {
    return null
  }
}

async function resolveDataSource(env, databaseId = env.NOTION_DATABASE_ID) {
  if (dataSourcesByDatabase.has(databaseId)) return dataSourcesByDatabase.get(databaseId)
  const res = await fetch(
    `${apiBase(env)}/v1/databases/${databaseId}`,
    { headers: notionHeaders(env) }
  )
  if (!res.ok) {
    throw new Error(`Notion database lookup failed: ${res.status} ${await res.text()}`)
  }
  const { data_sources: sources } = await res.json()
  if (!sources?.length) throw new Error('Notion database has no data source')
  dataSourcesByDatabase.set(databaseId, sources[0].id)
  return sources[0].id
}

function save(env, state) {
  return env.STATE.put(STATE_KEY, JSON.stringify(state))
}

function statusSet(env) {
  return new Set(
    (env.LIVE_STATUSES ?? 'Published,Invisible')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
}

function statusProperty(env) {
  return env.STATUS_PROPERTY || 'status'
}

function dateProperty(env) {
  return env.DATE_PROPERTY || 'date'
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
