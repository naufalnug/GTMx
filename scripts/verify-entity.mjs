#!/usr/bin/env node
/* Entity, linking and OG guard. Fetches every in-scope route from a running server.
   Usage: npm run verify:entity          (expects localhost:3000)
          BASE=https://gtmx.run npm run verify:entity
   NOTE: run it against production too. Locally DATABASE_URL is empty, so the three
   blog posts are served from the static seed and the CMS path is never exercised. */
const BASE = process.env.BASE || 'http://localhost:3000'
const SERVICES = ['automated-outbound', 'revops', 'seo-aeo']
const STUDIES = ['opensponsorship', 'strategy-achievers', 'metatron-concepts', 'united-safety-training']
const POSTS = ['why-your-sales-playbook-wont-scale', 'using-ai-to-build-your-first-outbound-pipeline', 'the-250k-mistake-hiring-us-vp-sales-too-early']
const ROUTES = ['/', '/about', '/contact', '/case-studies', '/content', '/privacy', '/terms', ...SERVICES.map(s => `/services/${s}`), ...STUDIES.map(s => `/case-studies/${s}`), ...POSTS.map(s => `/content/${s}`)]
/* Minimum CONTEXTUAL inlinks (header and footer excluded). Phase 4 table. */
const MIN = r => r.startsWith('/services/') ? 3 : (r.startsWith('/case-studies/') || r.startsWith('/content/') || ['/about', '/contact', '/case-studies'].includes(r)) ? 2 : 0
/* Strings whose conflicting side was resolved in Phase 2 Group 1 and must not reappear. */
const REJECTED = ['The GTMx Method, applied to', 'sales-qualified leads booked']
const fails = [], warns = [], pend = []
const fail = m => fails.push(m)
const txt = s => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()
const meta = (h, k) => (h.match(new RegExp(`<meta[^>]+(?:property|name)="${k}"[^>]+content="([^"]*)"`)) || [])[1]

const pages = {}
for (const r of ROUTES) {
  const res = await fetch(BASE + r)
  if (!res.ok) { fail(`${r}: HTTP ${res.status}`); continue }
  pages[r] = await res.text()
}
for (const extra of ['/llms.txt', '/feed.xml', '/sitemap.xml']) {
  const res = await fetch(BASE + extra)
  if (!res.ok) fail(`${extra}: HTTP ${res.status} (must exist)`)
  else if (extra === '/sitemap.xml') {
    const xml = await res.text()
    for (const must of ['https://gtmx.run<', 'https://gtmx.run/about<'])
      if (!xml.includes(`<loc>${must.replace('<', '')}</loc>`)) fail(`sitemap.xml missing ${must.replace('<', '')}`)
    const lms = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map(m => m[1].slice(0, 10))
    const t = new Date().toISOString().slice(0, 10), n = lms.filter(d => d === t).length
    if (lms.length && n > lms.length / 2) warns.push(`sitemap.xml: lastmod is today on ${n}/${lms.length} URLs`)
  }
}

// contextual link graph
const inlinks = {}
for (const r of ROUTES) {
  let b = (pages[r] || '').replace(/<script\b[\s\S]*?<\/script>/gi, '')
  for (const blk of [...b.matchAll(/<header\b[\s\S]*?<\/header>/gi), ...b.matchAll(/<footer\b[\s\S]*?<\/footer>/gi)]) b = b.replace(blk[0], '')
  for (const m of b.matchAll(/<a\b[^>]*href="(\/[^"]*)"/g)) {
    let t = m[1].split('#')[0].split('?')[0]
    t = t.length > 1 ? t.replace(/\/$/, '') : t
    if (t && t !== r && ROUTES.includes(t)) (inlinks[t] ||= new Set()).add(r)
  }
}
for (const r of ROUTES) {
  const n = (inlinks[r] || new Set()).size
  if (n < MIN(r)) fail(`${r}: ${n} contextual inlinks, needs ${MIN(r)}`)
  if (n === 0 && !['/', '/privacy', '/terms'].includes(r)) fail(`${r}: contextual ORPHAN`)
}

// per page
const seenSameAs = new Set()
let personFound = false
for (const r of ROUTES) {
  const html = pages[r]; if (!html) continue
  const head = html.slice(0, html.indexOf('</head>'))
  const img = meta(head, 'og:image')
  if (!img || !/^https?:\/\//.test(img)) fail(`${r}: og:image missing or not absolute`)
  else {
    const ir = await fetch(img.replace('https://gtmx.run', BASE.startsWith('http://localhost') ? BASE : 'https://gtmx.run'))
    if (!ir.ok) fail(`${r}: og:image HTTP ${ir.status}`)
    else if (!(ir.headers.get('content-type') || '').startsWith('image/')) fail(`${r}: og:image not image/*`)
  }  if (meta(head, 'og:image:width') !== '1200' || meta(head, 'og:image:height') !== '630') fail(`${r}: og:image width/height not 1200x630`)
  if (!meta(head, 'og:image:alt')) fail(`${r}: og:image:alt missing`)
  if (!meta(head, 'twitter:image')) fail(`${r}: twitter:image missing`)
  if (meta(head, 'twitter:card') !== 'summary_large_image') fail(`${r}: twitter:card is "${meta(head, 'twitter:card')}"`)
  // brand casing, excluding title and description which are out of scope
  const scan = html.replace(/<title>[\s\S]*?<\/title>/gi, '').replace(/<meta[^>]+description"[^>]*>/gi, '')
  for (const w of ['GTMX', 'Gtmx']) if (scan.includes(w)) fail(`${r}: brand written "${w}"`)
  for (const s of REJECTED) if (txt(html).includes(s)) fail(`${r}: rejected string still present: "${s}"`)
  // headings
  const hs = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => +m[1])
  if (hs.filter(l => l === 1).length !== 1) fail(`${r}: ${hs.filter(l => l === 1).length} h1`)
  for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) fail(`${r}: skipped heading level h${hs[i - 1]}->h${hs[i]}`)
  // JSON-LD
  const nodes = []
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let o; try { o = JSON.parse(m[1]) } catch (e) { fail(`${r}: invalid JSON-LD (${e.message})`); continue }
    for (const it of (Array.isArray(o) ? o : [o])) nodes.push(it)
  }
  const types = nodes.map(n => n['@type'])
  if (!types.includes('Organization')) fail(`${r}: no Organization JSON-LD`)
  if (!types.includes('WebSite')) fail(`${r}: no WebSite JSON-LD`)
  if (types.includes('Person')) personFound = true
  const defined = new Set(nodes.filter(n => n['@id']).map(n => n['@id']))
  const walk = n => {
    if (Array.isArray(n)) return n.forEach(walk)
    if (n && typeof n === 'object') {
      if (Object.keys(n).length === 1 && n['@id'] && !defined.has(n['@id'])) fail(`${r}: unresolved @id ${n['@id']}`)
      if (/^(AggregateRating|Review|Rating)$/.test(n['@type'])) fail(`${r}: forbidden ${n['@type']} schema`)
      Object.values(n).forEach(walk)
    }
  }
  nodes.forEach(walk)
  for (const n of nodes) for (const u of [].concat(n.sameAs || [])) seenSameAs.add(u)
  // byline: held by decision D5 until the founder surname is supplied
  if (r.startsWith('/content/') && !/rel="author"|class="[^"]*byline/i.test(html)) {
    (personFound ? fails : pend).push(`${r}: no visible byline linked to the author page`)
  }
}

// sameAs must resolve. LinkedIn always answers 999 to a script; that counts as verified.
for (const u of seenSameAs) {
  const res = await fetch(u, { redirect: 'follow' }).catch(() => null)
  const ok = res && (res.ok || (res.status === 999 && /(^|\.)linkedin\.com$/.test(new URL(u).hostname)))
  if (!ok) fail(`sameAs does not resolve: ${u} (${res ? res.status : 'network error'})`)
}
if (!personFound) pend.push('Person JSON-LD absent (decision D5: held pending founder surname)')

for (const w of warns) console.warn('WARN    ' + w)
for (const p of pend) console.warn('PENDING ' + p)
for (const f of fails) console.error('FAIL    ' + f)
console.log(`\n${ROUTES.length} routes — ${fails.length} failures, ${warns.length} warnings, ${pend.length} pending-by-decision`)
process.exit(fails.length ? 1 : 0)
