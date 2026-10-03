#!/usr/bin/env node
/* Guards the eleven medium-priority issues (M1-M11) against the rendered site.
   Usage: npm run verify:medium   |   BASE=https://gtmx.run npm run verify:medium
   No new dependencies: regex over the served HTML, same approach as the other
   verify scripts in this repo. */
const BASE = process.env.BASE || 'http://localhost:3000'
const CANON = 'https://gtmx.run'
const SVC = ['automated-outbound', 'revops', 'seo-aeo']
const CS = ['opensponsorship', 'strategy-achievers', 'vidify', 'united-safety-training']
const POSTS = ['why-your-sales-playbook-wont-scale', 'using-ai-to-build-your-first-outbound-pipeline', 'the-250k-mistake-hiring-vp-sales-first']
const ROUTES = ['/', '/about', '/contact', '/engagements', '/case-studies', '/blog', '/privacy', '/terms',
  ...SVC.map(s => `/services/${s}`), ...CS.map(c => `/case-studies/${c}`), ...POSTS.map(p => `/blog/${p}`)]
/* First Load JS per route after the last approved lever (.claude/perf-results.md), +5%. */
const JS_BUDGET = { '/': 636.5, '/services/revops': 616.5, '/case-studies/vidify': 614.8, default: 613.0 }
const GENERIC_H2 = ['The problem.', "What's included.", 'How it works.', 'Fair questions.']
const RELATIVE_TIME = ['years ago', 'year ago', 'last year', 'this year', 'recently', 'nowadays', 'these days']
/* Numbers allowed in a case study meta: each verified present in that page's body.
   Vidify is deliberately absent: its results are an unresolved contradiction. */
const META_NUMBERS = { opensponsorship: ['170', '10', '2,321'], 'strategy-achievers': ['150', '21'], vidify: [], 'united-safety-training': ['60'] }
const BANNED_PROPS = ['aggregateRating', 'review', 'areaServed', 'priceRange', 'telephone', 'address', 'foundingDate']

const fails = [], warns = []
const fail = m => fails.push(m)
const warn = m => warns.push(m)
const norm = s => String(s).replace(/\s+/g, ' ').trim()
const text = h => norm(h.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '')
  .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#x27;|&apos;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ').replace(/&[a-z#0-9]+;/gi, ' '))
const meta = (h, k) => (h.match(new RegExp(`<meta[^>]+(?:property|name)="${k}"[^>]+content="([^"]*)"`, 'i')) || [])[1]

const page = {}
for (const r of ROUTES) {
  const res = await fetch(BASE + r, { redirect: 'manual' })
  if (res.status !== 200) { fail(`${r}: HTTP ${res.status}`); continue }
  page[r] = await res.text()
}

// ── M2 discovery ───────────────────────────────────────────────────────────
const smRes = await fetch(`${BASE}/sitemap.xml`)
if (!smRes.ok) fail('sitemap.xml missing')
else {
  const xml = await smRes.text()
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  if (!locs.includes(CANON)) fail('sitemap.xml missing the homepage')
  if (/<priority>|<changefreq>/.test(xml)) fail('sitemap.xml still emits priority/changefreq')
  for (const loc of locs) {
    if (!loc.startsWith(`${CANON}/`) && loc !== CANON) fail(`sitemap: wrong host or scheme: ${loc}`)
    if (loc !== CANON && loc.endsWith('/')) fail(`sitemap: trailing slash: ${loc}`)
    const p = loc.replace(CANON, '') || '/'
    const r = await fetch(BASE + p, { redirect: 'manual' })
    if (r.status !== 200) { fail(`sitemap lists non-200 (${r.status}): ${loc}`); continue }
    const h = await r.text(), head = h.slice(0, h.indexOf('</head>'))
    if (/noindex/i.test(head)) fail(`sitemap lists a noindex URL: ${loc}`)
    const canon = (head.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/) || [])[1]
    if (canon && canon !== loc) fail(`sitemap URL not self-canonical: ${loc} -> ${canon}`)
  }
  const lms = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map(m => m[1].slice(0, 10))
  if (lms.length < locs.length) fail(`sitemap: ${locs.length - lms.length} URLs missing lastmod`)
  const today = new Date().toISOString().slice(0, 10)
  const n = lms.filter(d => d === today).length
  if (lms.length && n > lms.length / 2) warn(`sitemap: lastmod is today on ${n}/${lms.length} URLs`)
}
const robots = await (await fetch(`${BASE}/robots.txt`)).text()
if (!/^Sitemap:\s*https?:\/\//mi.test(robots)) fail('robots.txt has no absolute Sitemap: line')
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
  const block = robots.split(/\n\s*\n/).find(b => new RegExp(`User-Agent:\\s*${bot}`, 'i').test(b))
  if (block && /Disallow:\s*\/\s*$/m.test(block)) warn(`robots.txt blocks ${bot}`)
}
const llms = await (await fetch(`${BASE}/llms.txt`)).text()
for (const u of [...new Set([...llms.matchAll(/https:\/\/gtmx\.run[^\s)]*/g)].map(m => m[0]))]) {
  const r = await fetch(BASE + (u.replace(CANON, '') || '/'), { redirect: 'manual' })
  if (r.status !== 200) fail(`llms.txt lists a ${r.status} URL: ${u}`)
}

// ── M7 slug ────────────────────────────────────────────────────────────────
const old = await fetch(`${BASE}/case-studies/metatron-concepts`, { redirect: 'manual' })
if (old.status !== 301) fail(`old slug returns ${old.status}, expected 301`)
const dest = old.headers.get('location') || ''
if (!dest.endsWith('/case-studies/vidify')) fail(`old slug redirects to ${dest}`)
else {
  const hop2 = await fetch(BASE + '/case-studies/vidify', { redirect: 'manual' })
  if (hop2.status !== 200) fail(`redirect chain: /case-studies/vidify returns ${hop2.status}`)
}
for (const r of ROUTES) if (page[r]?.includes('metatron-concepts')) fail(`${r}: still references the old slug`)

// ── per route ──────────────────────────────────────────────────────────────
const metas = new Map()
for (const r of ROUTES) {
  const h = page[r]; if (!h) continue
  const head = h.slice(0, h.indexOf('</head>'))
  const body = text(h)

  // M10 titles
  const title = norm((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '')
  const og = norm(meta(head, 'og:title') || ''), tw = norm(meta(head, 'twitter:title') || '')
  if (!title) fail(`${r}: no <title>`)
  if (og !== title) fail(`${r}: og:title differs from title`)
  if (tw !== og) fail(`${r}: twitter:title differs from og:title`)
  if (/[–—]/.test(title)) fail(`${r}: title uses an en/em dash as separator`)
  if (!/GTMx/.test(title)) fail(`${r}: title does not carry the brand`)

  // M7 case study metas
  const slug = r.startsWith('/case-studies/') && r !== '/case-studies' ? r.split('/').pop() : null
  if (slug) {
    const d = norm(meta(head, 'description') || '')
    if (d.length < 140 || d.length > 158) fail(`${r}: meta description is ${d.length} chars, needs 140-158`)
    if (metas.has(d)) fail(`${r}: duplicate meta description with ${metas.get(d)}`)
    metas.set(d, r)
    for (const num of d.match(/\d[\d,]*/g) || []) {
      if (!(META_NUMBERS[slug] || []).some(ok => num.includes(ok) || ok.includes(num)))
        fail(`${r}: meta contains unapproved number "${num}"`)
    }
  }

  // M1/M4/M5 carry-over
  const heads = [...h.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
  const lv = heads.map(m => +m[1])
  if (lv.filter(x => x === 1).length !== 1) fail(`${r}: ${lv.filter(x => x === 1).length} h1`)
  for (let i = 1; i < lv.length; i++) if (lv[i] > lv[i - 1] + 1) fail(`${r}: skipped heading level h${lv[i - 1]}->h${lv[i]}`)
  for (const m of heads) {
    const t = text(m[2])
    if (/[A-Za-z],[A-Za-z]|[a-z]\.[a-z]/.test(t) && !/\.clay|\.json|_audit|_tracker/.test(t))
      fail(`${r}: glued punctuation in heading "${t}"`)
    if (r.startsWith('/services/') && +m[1] === 2 && GENERIC_H2.includes(t)) fail(`${r}: generic service h2 "${t}"`)
  }
  /* "revops service" is a quoted mock SERP query inside the Method demo widget
     (components/home/Method.jsx:67). Search queries are lowercase by nature. */
  const lower = body.replace(/"revops service"/g, '')
  for (const w of ['seo + aeo', 'revops']) {
    const re = new RegExp(`(?<![A-Za-z/])${w.replace('+', '\\+')}(?![A-Za-z])`, 'g')
    if (re.test(lower)) fail(`${r}: lowercase "${w}" in visible text`)
  }
  if (h.includes('[object Object]')) fail(`${r}: "[object Object]" in rendered HTML`)

  // M11 structured data
  const blocks = [...h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
  if (blocks.length !== 1) fail(`${r}: ${blocks.length} JSON-LD scripts, expected 1`)
  const nodes = []
  for (const b of blocks) {
    let o; try { o = JSON.parse(b[1]) } catch (e) { fail(`${r}: JSON-LD does not parse (${e.message})`); continue }
    nodes.push(...(o['@graph'] || [o]))
  }
  const defined = new Set(nodes.filter(n => n['@id']).map(n => n['@id']))
  const walk = n => {
    if (Array.isArray(n)) return n.forEach(walk)
    if (!n || typeof n !== 'object') return
    if (Object.keys(n).length === 1 && n['@id'] && !defined.has(n['@id'])) fail(`${r}: unresolved @id ${n['@id']}`)
    if (/^(AggregateRating|Review|Rating)$/.test(n['@type'])) fail(`${r}: forbidden @type ${n['@type']}`)
    for (const [k, v] of Object.entries(n)) { if (BANNED_PROPS.includes(k)) fail(`${r}: forbidden property "${k}"`); walk(v) }
  }
  nodes.forEach(walk)
  for (const n of nodes.filter(x => x['@type'] === 'FAQPage')) for (const q of n.mainEntity || []) {
    if (!body.includes(norm(q.name))) fail(`${r}: FAQ question not visible: "${norm(q.name).slice(0, 50)}"`)
    const ans = norm(q.acceptedAnswer?.text || '')
    if (ans && !body.includes(ans)) fail(`${r}: FAQ answer not visible: "${ans.slice(0, 50)}"`)
  }
  for (const n of nodes.filter(x => x['@type'] === 'BreadcrumbList')) {
    const items = n.itemListElement || []
    items.forEach((it, i) => { if (it.position !== i + 1) fail(`${r}: breadcrumb position ${it.position} at index ${i}`) })
    const last = items[items.length - 1]
    if (last && last.item !== `${CANON}${r === '/' ? '' : r}`) fail(`${r}: last breadcrumb is ${last.item}`)
  }
  const td = new Date().toISOString().slice(0, 10)
  for (const n of nodes) {
    for (const k of ['datePublished', 'dateModified']) if (n[k] && (Number.isNaN(Date.parse(n[k])) || n[k].slice(0, 10) > td)) fail(`${r}: ${k} invalid or future (${n[k]})`)
    if (n.datePublished && n.dateModified && Date.parse(n.dateModified) < Date.parse(n.datePublished)) fail(`${r}: dateModified before datePublished`)
  }

  // M8 blog
  if (r.startsWith('/blog/')) {
    if (!/<time[^>]*datetime=/i.test(h)) fail(`${r}: no visible <time datetime>`)
    const hasImg = /<img\b/i.test(h.split('<footer')[0]) || /<svg[^>]+role="img"/i.test(h)
    if (!hasImg) fail(`${r}: post has no image or diagram`)
    const svg = h.match(/<svg[^>]+role="img"[^>]*>/i)
    if (svg && !/aria-label="[^"]{10,}"/.test(svg[0])) fail(`${r}: diagram has no descriptive aria-label`)
    if (svg && !/width="\d+"/.test(svg[0])) fail(`${r}: diagram has no explicit width/height`)
    /* Sources are required only when the post makes an external quantified
       claim: a currency amount or a percentage. A post whose figures were
       removed rather than sourced has nothing to cite, and adding a citation
       to satisfy a checker would be fabrication. */
    const articleBody = h.split('<footer')[0]
    /* Scope the scan to the prose body only. The "Keep reading" block links to
       a sibling post whose TITLE contains "$250K", which is link text, not a
       claim this post is making. */
    const prose = text((articleBody.match(/article-page__body"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '')
    const hasExternalStat = /\$\s?\d|\d\s?%/.test(prose)
    if (hasExternalStat) {
      if (!/article-page__sources/.test(h)) fail(`${r}: has a $ or % claim but no Sources section`)
      if (!/href="https?:\/\/(?!gtmx\.run)/.test(articleBody)) fail(`${r}: has a $ or % claim but no external primary-source link`)
    }
    const first150 = body.split(' ').slice(0, 150).join(' ')
    const answer = text((h.match(/article-page__answer">([\s\S]*?)<\/p>/) || [])[1] || '')
    if (!answer) fail(`${r}: no answer block`)
    else if (!first150.includes(answer.split(' ').slice(0, 6).join(' '))) fail(`${r}: answer block not in the first 150 words`)
    for (const p of RELATIVE_TIME) if (body.toLowerCase().includes(p)) warn(`${r}: relative time phrase "${p}"`)
  }

  // M9 trust pages
  if (r === '/engagements') {
    if (/\$\s?\d/.test(body)) fail(`${r}: a $ amount is present but the pricing policy is "none"`)
  }
  if (['/about', '/contact', '/engagements'].includes(r)) {
    const footer = (h.match(/<footer\b[\s\S]*?<\/footer>/i) || [''])[0]
    if (!footer.includes(`href="${r}"`)) fail(`${r}: not linked from the footer`)
  }
}

// ── M6 homepage results cards ──────────────────────────────────────────────
const csLinks = new Set([...(page['/'] || '').matchAll(/href="(\/case-studies\/[^"]+)"/g)].map(m => m[1]))
if (csLinks.size < 3) fail(`homepage links to only ${csLinks.size} case studies, expected at least 3`)

// ── M3 performance guard ───────────────────────────────────────────────────
for (const r of ['/', '/about', '/services/revops', '/case-studies/vidify']) {
  const h = page[r]; if (!h) continue
  const js = [...new Set([...h.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map(m => m[1]))]
  let total = 0
  for (const u of js) total += (await (await fetch(BASE + u)).arrayBuffer()).byteLength
  const kb = total / 1024
  const budget = (JS_BUDGET[r] ?? JS_BUDGET.default) * 1.05
  if (kb > budget) fail(`${r}: First Load JS ${kb.toFixed(1)} KB exceeds ${budget.toFixed(1)} KB (budget +5%)`)
}

for (const w of warns) console.warn('WARN  ' + w)
for (const f of fails) console.error('FAIL  ' + f)
console.log(`\n${ROUTES.length} routes - ${fails.length} failures, ${warns.length} warnings`)
process.exit(fails.length ? 1 : 0)
