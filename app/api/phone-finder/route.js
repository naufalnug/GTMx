// app/api/phone-finder/route.js
//
// Secure proxy for the Phone Finder tool (public/tools/phone-finder.html).
// Holds NO secrets in source — the repo is public. Reads two values from the
// Vercel environment at runtime:
//   AI_ARK_TOKEN  — your AI Ark developer token (billed). Never sent to the browser.
//   APP_PASSWORD  — the gate. Validated here, server-side, so it can't be bypassed
//                   by editing the page or reading the source.
//
// The browser sends the password in the `x-pf-pass` header on every call; a wrong
// password never reaches AI Ark, so it can never spend a credit.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE = 'https://api.ai-ark.com/api/developer-portal'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0 Safari/537.36'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Best-effort brute-force brake. In-memory, per warm instance — not bulletproof
// across serverless cold starts, but it adds real friction. Pair it with a
// strong APP_PASSWORD (a 7-digit PIN is ~10M guesses; a passphrase is not).
const attempts = new Map()
function bump(ip, ok) {
  const now = Date.now()
  const rec = attempts.get(ip) || { n: 0, t: now }
  if (now - rec.t > 10 * 60 * 1000) { rec.n = 0; rec.t = now }
  if (ok) { rec.n = 0 } else { rec.n += 1 }
  attempts.set(ip, rec)
  return rec.n
}
function tooMany(ip) {
  const rec = attempts.get(ip)
  return rec ? rec.n >= 25 : false
}

function ark(path, body, method = 'POST') {
  return fetch(BASE + path, {
    method,
    headers: {
      'X-TOKEN': process.env.AI_ARK_TOKEN || '',
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function parsePhone(data) {
  const nums = []
  if (data && typeof data === 'object') {
    const d2 = data.data
    if (Array.isArray(d2)) {
      for (const grp of d2) {
        if (Array.isArray(grp)) nums.push(...grp.filter((x) => typeof x === 'string' && x.trim()))
        else if (typeof grp === 'string' && grp.trim()) nums.push(grp)
      }
    }
    if (!nums.length) {
      for (const k of ['phone', 'phone_number', 'mobile', 'number']) {
        if (typeof data[k] === 'string') nums.push(data[k])
      }
    }
  }
  const seen = new Set()
  const out = []
  for (let n of nums) {
    n = n.trim()
    if (n && !seen.has(n)) { seen.add(n); out.push(n) }
  }
  return out
}

function personCard(item) {
  const prof = item.profile || {}
  const comp = (item.company && item.company.summary) || {}
  const clink = (item.company && item.company.link) || {}
  return {
    name: prof.full_name || null,
    title: prof.title || prof.headline || null,
    linkedin: (item.link || {}).linkedin || null,
    location: (item.location || {}).default || null,
    seniority: (item.department || {}).seniority || null,
    company_name: comp.name || null,
    company_linkedin: clink.linkedin || null,
    company_domain: clink.domain || null,
  }
}

const J = (obj, status = 200) => Response.json(obj, { status })

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  if (tooMany(ip)) { await sleep(800); return J({ error: 'too many attempts — wait a few minutes' }, 429) }

  const expected = process.env.APP_PASSWORD || ''
  if (!expected) return J({ error: 'server not configured (APP_PASSWORD not set in Vercel)' }, 500)

  const pass = req.headers.get('x-pf-pass') || ''
  if (pass !== expected) {
    bump(ip, false)
    await sleep(500)
    return J({ error: 'unauthorized' }, 401)
  }
  bump(ip, true)

  let payload = {}
  try { payload = await req.json() } catch { payload = {} }
  const action = payload.action

  if (action === 'auth') return J({ ok: true })

  if (!process.env.AI_ARK_TOKEN) {
    return J({ error: 'server not configured (AI_ARK_TOKEN not set in Vercel)' }, 500)
  }

  try {
    if (action === 'credits') {
      const r = await ark('/v1/payments/credits', null, 'GET')
      const d = await r.json().catch(() => ({}))
      return J({ credits: d && typeof d.total === 'number' ? d.total : null })
    }

    if (action === 'lookup') {
      const li = (payload.linkedin || '').trim()
      if (!li) return J({ error: 'linkedin url required' }, 400)
      const r = await ark('/v1/people', { contact: { linkedin: { any: { include: [li] } } }, page: 0, size: 1 })
      if (!r.ok) return J({ error: `AI Ark returned ${r.status}` })
      const d = await r.json()
      const c = d.content || []
      if (!c.length) return J({ found: false })
      return J({ found: true, person: personCard(c[0]) })
    }

    if (action === 'phone') {
      const li = (payload.linkedin || '').trim()
      if (!li) return J({ error: 'linkedin url required' }, 400)
      const r = await ark('/v2/people/mobile-phone-finder', { linkedin: li }, 'POST')
      if (r.status === 404) return J({ linkedin: li, phones: [] })
      if (!r.ok) return J({ linkedin: li, phones: [], error: `AI Ark ${r.status}` })
      const d = await r.json().catch(() => ({}))
      return J({ linkedin: li, phones: parsePhone(d) })
    }

    if (action === 'team') {
      const compLi = (payload.company_linkedin || '').trim()
      const compDom = (payload.company_domain || '').trim()
      const exclude = (payload.exclude || '').trim().replace(/\/+$/, '').toLowerCase()
      let size = parseInt(payload.size, 10)
      if (!(size >= 1 && size <= 50)) size = 15
      let account
      if (compLi) account = { linkedin: { any: { include: [compLi] } } }
      else if (compDom) account = { url: { any: { include: { mode: 'SMART', content: [compDom] } } } }
      else return J({ error: 'company_linkedin or company_domain required' }, 400)
      const r = await ark('/v1/people', { account, page: 0, size })
      if (!r.ok) return J({ error: `AI Ark returned ${r.status}` })
      const d = await r.json()
      let people = (d.content || []).map(personCard)
      people = people.filter((p) => (p.linkedin || '').replace(/\/+$/, '').toLowerCase() !== exclude)
      return J({ total: typeof d.totalElements === 'number' ? d.totalElements : null, people })
    }

    return J({ error: 'unknown action' }, 400)
  } catch (e) {
    return J({ error: String((e && e.message) || e) }, 500)
  }
}
// redeploy trigger 1
