#!/usr/bin/env node
/* Fetches every route, parses every JSON-LD block, and checks the Phase 7 rules.
   Usage: npm run validate:schema   |   BASE=https://gtmx.run npm run validate:schema */
const BASE = process.env.BASE || 'http://localhost:3000'
const SVC = ['automated-outbound', 'revops', 'seo-aeo']
const CS = ['opensponsorship', 'strategy-achievers', 'vidify', 'united-safety-training']
const POSTS = ['why-your-sales-playbook-wont-scale', 'using-ai-to-build-your-first-outbound-pipeline', 'the-250k-mistake-hiring-vp-sales-first']
/* route -> types that MUST be present (the Phase 7.2 map) */
const EXPECT = {
  '/': ['Organization', 'WebSite', 'WebPage', 'FAQPage', 'Service'],
  '/about': ['Organization', 'WebSite', 'AboutPage', 'Person', 'BreadcrumbList'],
  '/contact': ['Organization', 'WebSite', 'ContactPage', 'BreadcrumbList'],
  '/engagements': ['Organization', 'WebSite', 'WebPage', 'Service', 'BreadcrumbList'],
  '/case-studies': ['Organization', 'WebSite', 'CollectionPage', 'BreadcrumbList'],
  '/blog': ['Organization', 'WebSite', 'CollectionPage', 'BreadcrumbList'],
  '/privacy': ['Organization', 'WebSite', 'WebPage'],
  '/terms': ['Organization', 'WebSite', 'WebPage'],
}
for (const s of SVC) EXPECT[`/services/${s}`] = ['Organization', 'WebSite', 'WebPage', 'Service', 'FAQPage', 'BreadcrumbList']
for (const c of CS) EXPECT[`/case-studies/${c}`] = ['Organization', 'WebSite', 'Article', 'WebPage', 'BreadcrumbList']
for (const p of POSTS) EXPECT[`/blog/${p}`] = ['Organization', 'WebSite', 'BlogPosting', 'WebPage', 'BreadcrumbList']

const BANNED = ['aggregateRating', 'review', 'areaServed', 'priceRange', 'telephone', 'address', 'foundingDate']
const BANNED_TYPES = ['AggregateRating', 'Review', 'Rating']
const norm = s => String(s).replace(/\s+/g, ' ').trim()
const strip = h => norm(h.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#x27;|&apos;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ').replace(/&[a-z#0-9]+;/gi, ' '))

const fails = []
const rows = []
const today = new Date().toISOString().slice(0, 10)

for (const route of Object.keys(EXPECT)) {
  const res = await fetch(BASE + route)
  if (!res.ok) { fails.push(`${route}: HTTP ${res.status}`); continue }
  const html = await res.text()
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
  if (blocks.length !== 1) fails.push(`${route}: ${blocks.length} JSON-LD scripts, expected exactly 1`)

  const nodes = []
  for (const b of blocks) {
    let parsed
    try { parsed = JSON.parse(b[1]) } catch (e) { fails.push(`${route}: JSON-LD does not parse (${e.message})`); continue }
    if (!parsed['@graph']) fails.push(`${route}: JSON-LD is not a single @graph`)
    nodes.push(...(parsed['@graph'] || [parsed]))
  }
  const types = nodes.map(n => n['@type']).filter(Boolean)
  rows.push([route, [...new Set(types)].join(', '), blocks.length])

  for (const t of EXPECT[route]) if (!types.includes(t)) fails.push(`${route}: missing expected @type ${t}`)

  const defined = new Set(nodes.filter(n => n['@id']).map(n => n['@id']))
  const visible = strip(html)
  const walk = (n, path) => {
    if (Array.isArray(n)) return n.forEach(x => walk(x, path))
    if (!n || typeof n !== 'object') return
    if (Object.keys(n).length === 1 && n['@id'] && !defined.has(n['@id'])) fails.push(`${route}: unresolved @id ${n['@id']}`)
    if (BANNED_TYPES.includes(n['@type'])) fails.push(`${route}: forbidden @type ${n['@type']}`)
    for (const [k, v] of Object.entries(n)) {
      if (BANNED.includes(k)) fails.push(`${route}: forbidden property "${k}"`)
      if (v === '' || v === null || (Array.isArray(v) && v.length === 0)) fails.push(`${route}: empty property "${k}"`)
      walk(v, `${path}.${k}`)
    }
  }
  nodes.forEach(n => walk(n, n['@type']))

  // FAQ text must appear verbatim in the visible HTML
  for (const n of nodes.filter(x => x['@type'] === 'FAQPage')) {
    for (const q of n.mainEntity || []) {
      if (!visible.includes(norm(q.name))) fails.push(`${route}: FAQ question not visible on page: "${norm(q.name).slice(0, 60)}"`)
      const a = norm(q.acceptedAnswer?.text || '')
      if (a && !visible.includes(a)) fails.push(`${route}: FAQ answer not visible on page: "${a.slice(0, 60)}"`)
    }
  }

  // Breadcrumbs: consecutive from 1, last item is this page
  for (const n of nodes.filter(x => x['@type'] === 'BreadcrumbList')) {
    const items = n.itemListElement || []
    items.forEach((it, i) => {
      if (it.position !== i + 1) fails.push(`${route}: breadcrumb position ${it.position} at index ${i}`)
      if (!/^https:\/\//.test(it.item)) fails.push(`${route}: breadcrumb item not absolute: ${it.item}`)
    })
    const last = items[items.length - 1]
    const expected = `https://gtmx.run${route === '/' ? '' : route}`
    if (last && last.item !== expected) fails.push(`${route}: last breadcrumb is ${last.item}, expected ${expected}`)
  }

  // Dates
  for (const n of nodes) {
    for (const k of ['datePublished', 'dateModified']) {
      if (!n[k]) continue
      if (Number.isNaN(Date.parse(n[k]))) fails.push(`${route}: ${k} is not a valid date (${n[k]})`)
      if (n[k].slice(0, 10) > today) fails.push(`${route}: ${k} is in the future (${n[k]})`)
    }
    if (n.datePublished && n.dateModified && Date.parse(n.dateModified) < Date.parse(n.datePublished))
      fails.push(`${route}: dateModified earlier than datePublished`)
  }
}

console.log('route'.padEnd(54) + 'scripts  types')
for (const [r, t, n] of rows) console.log(r.padEnd(54) + String(n).padEnd(9) + t)
console.log()
for (const f of fails) console.error('FAIL  ' + f)
console.log(`\n${rows.length} routes - ${fails.length} failures`)
console.log('Run Google Rich Results Test and the Schema.org validator on one URL per page type by hand. This script does not prove they pass.')
process.exit(fails.length ? 1 : 0)
