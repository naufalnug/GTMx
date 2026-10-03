#!/usr/bin/env node
/* Guards the six low-priority issues (L1-L6). No new dependencies: regex over the
   served HTML, same approach as the other verify scripts here.
   Usage: npm run verify:low | BASE=https://gtmx.run npm run verify:low */
const BASE = process.env.BASE || 'http://localhost:3000'
const CANON = 'https://gtmx.run'
const SVC = ['automated-outbound', 'revops', 'seo-aeo']
const CS = ['opensponsorship', 'strategy-achievers', 'vidify', 'united-safety-training']
const POSTS = ['why-your-sales-playbook-wont-scale', 'using-ai-to-build-your-first-outbound-pipeline', 'the-250k-mistake-hiring-vp-sales-first']
const ROUTES = ['/', '/about', '/contact', '/engagements', '/case-studies', '/blog', '/book', '/privacy', '/terms',
  ...SVC.map(s => `/services/${s}`), ...CS.map(c => `/case-studies/${c}`), ...POSTS.map(p => `/blog/${p}`)]
/* Routes that hold a booking widget of their own, so their CTA may stay an anchor. */
const HAS_WIDGET = new Set(['/', '/book', ...SVC.map(s => `/services/${s}`), ...CS.map(c => `/case-studies/${c}`)])
const VP = '/blog/the-250k-mistake-hiring-vp-sales-first'
const OLD_PREFIX = '/content'
const PARTNERS = ['Clay', 'Smartlead', 'Instantly', 'HeyReach', 'EmailBison', 'Trigify']
/* Confirmed by the owner 2026-10-03. Any tool NOT here must not carry partner wording. */
const CONFIRMED_PARTNERS = new Set(PARTNERS)
const BANNED_VAGUE = ['multiple millions']

const fails = [], warns = []
const fail = m => fails.push(m), warn = m => warns.push(m)
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

// ── L1: the move ───────────────────────────────────────────────────────────
const MAP = { '/content': '/blog', [`${OLD_PREFIX}/${POSTS[0]}`]: `/blog/${POSTS[0]}`,
  [`${OLD_PREFIX}/${POSTS[1]}`]: `/blog/${POSTS[1]}`,
  [`${OLD_PREFIX}/the-250k-mistake-hiring-us-vp-sales-too-early`]: VP }
for (const [old, want] of Object.entries(MAP)) {
  const r1 = await fetch(BASE + old, { redirect: 'manual' })
  if (r1.status !== 301) { fail(`L1 ${old}: ${r1.status}, expected 301`); continue }
  const loc = (r1.headers.get('location') || '').replace(BASE, '').replace(CANON, '')
  if (loc !== want) fail(`L1 ${old}: redirects to ${loc}, expected ${want}`)
  const r2 = await fetch(BASE + loc, { redirect: 'manual' })
  if (r2.status !== 200) fail(`L1 ${old}: chain, ${loc} returns ${r2.status}`)
}
for (const r of ROUTES) if (page[r]?.includes(OLD_PREFIX)) fail(`L1 ${r}: still references ${OLD_PREFIX}`)
for (const f of ['/sitemap.xml', '/llms.txt', '/feed.xml']) {
  const body = await (await fetch(BASE + f)).text()
  if (body.includes(OLD_PREFIX)) fail(`L1 ${f}: contains ${OLD_PREFIX}`)
}
// nav/footer label must agree with href
for (const m of (page['/'] || '').matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]{0,30})<\/a>/g)) {
  if (/^\s*Blog\s*$/i.test(m[2]) && m[1] !== '/blog') fail(`L1 "Blog" label points at ${m[1]}`)
}

// ── L2: VP title and slug ──────────────────────────────────────────────────
{
  const h = page[VP] || ''
  const title = norm((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '')
  if (title.length > 60) fail(`L2 ${VP}: title is ${title.length} chars, max 60`)
  const h1 = text((h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '')
  const words = VP.split('/').pop().split('-')
  const hit = words.filter(w => title.toLowerCase().includes(w) || h1.toLowerCase().includes(w)).length
  const pct = Math.round((100 * hit) / words.length)
  if (pct < 60) fail(`L2 ${VP}: only ${pct}% of slug words appear in the title or h1`)
  const oldSlug = await fetch(`${BASE}${OLD_PREFIX}/the-250k-mistake-hiring-us-vp-sales-too-early`, { redirect: 'manual' })
  if (oldSlug.status === 200) fail('L2 old VP slug still reachable without a redirect')
}
for (const r of ROUTES) {
  const t = norm(((page[r] || '').match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '')
  if (t.length > 60) warn(`L2 ${r}: title is ${t.length} chars`)
}

// ── per route: L3, L4, L5, L6, sitewide ────────────────────────────────────
const altSeen = []
for (const r of ROUTES) {
  const h = page[r]; if (!h) continue
  const head = h.slice(0, h.indexOf('</head>'))
  const body = text(h)

  // L3 twitter cards
  const card = meta(head, 'twitter:card'), twImg = meta(head, 'twitter:image'), ogImg = meta(head, 'og:image')
  if (card === 'summary_large_image' && !twImg) fail(`L3 ${r}: summary_large_image without twitter:image`)
  if (card !== 'summary_large_image' && twImg) warn(`L3 ${r}: has twitter:image but card is "${card}"`)
  for (const k of ['twitter:title', 'twitter:description', 'twitter:image:alt', 'og:image:alt']) {
    if (!meta(head, k)) fail(`L3 ${r}: missing ${k}`)
  }
  if (norm(meta(head, 'og:title') || '') !== norm(meta(head, 'twitter:title') || '')) fail(`L3 ${r}: og:title != twitter:title`)
  if (ogImg) {
    const ir = await fetch(ogImg.replace(CANON, BASE.startsWith('http://localhost') ? BASE : CANON))
    if (!ir.ok) fail(`L3 ${r}: og:image HTTP ${ir.status}`)
    else {
      const ct = ir.headers.get('content-type') || ''
      if (!ct.startsWith('image/')) fail(`L3 ${r}: og:image is ${ct}`)
      const buf = Buffer.from(await ir.arrayBuffer())
      if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
        const w = buf.readUInt32BE(16), hh = buf.readUInt32BE(20)
        if (w !== 1200 || hh !== 630) fail(`L3 ${r}: og:image is ${w}x${hh}, expected 1200x630`)
      }
    }
  }

  // L4 booking
  const anchors = [...h.matchAll(/href="#book"/g)].length
  if (anchors > 0 && !h.includes('id="book"')) fail(`L4 ${r}: ${anchors} #book link(s) but no id="book" on the page`)
  if (!HAS_WIDGET.has(r) && /href="\/#book"/.test(h.replace(/<header[\s\S]*?<\/header>/i, '').replace(/<footer[\s\S]*?<\/footer>/i, '')))
    fail(`L4 ${r}: body CTA still points at /#book, expected /book`)

  // L5 claims
  for (const p of BANNED_VAGUE) if (body.toLowerCase().includes(p)) fail(`L5 ${r}: banned vague phrase "${p}"`)
  if (/YC\s*&\s*public-co operators/i.test(body)) fail(`L5 ${r}: "YC & public-co operators" still present and unreplaced`)

  // L6 images
  for (const a of h.match(/<img\b[^>]*>/g) || []) {
    const src = (a.match(/src="([^"]*)"/) || [])[1] || ''
    const alt = (a.match(/alt="([^"]*)"/) || [])[1]
    if (alt === undefined) { fail(`L6 ${r}: <img> with no alt: ${src}`); continue }
    const file = src.split('/').pop().replace(/\.[a-z0-9]+$/i, '')
    if (alt.toLowerCase() === file.toLowerCase()) fail(`L6 ${r}: alt equals filename (${src})`)
    if (alt.length > 125) warn(`L6 ${r}: alt is ${alt.length} chars (${src})`)
    if (!/width="\d+"/.test(a) || !/height="\d+"/.test(a)) fail(`L6 ${r}: <img> without dimensions: ${src}`)
    if (src.includes('/partners/')) {
      const brand = PARTNERS.find(b => src.toLowerCase().includes(b.toLowerCase()))
      if (!brand) fail(`L6 ${r}: unknown partner logo ${src}`)
      else {
        if (!alt.includes(brand)) fail(`L6 ${r}: partner alt missing brand name (${src})`)
        if (/official .* partner/i.test(alt) && !CONFIRMED_PARTNERS.has(brand))
          fail(`L6 ${r}: "official partner" wording for unconfirmed tool ${brand}`)
      }
    }
    altSeen.push([r, src, alt])
  }

  // sitewide
  if (h.includes('[object Object]')) fail(`${r}: "[object Object]" in rendered HTML`)
}

// ── L4: /book specifics ────────────────────────────────────────────────────
{
  const h = page['/book']
  if (!h) fail('L4 /book missing or non-200')
  else {
    if (!/<noscript>/i.test(h)) fail('L4 /book: no <noscript> fallback')
    const lv = [...h.matchAll(/<h([1-6])\b/g)].map(m => +m[1])
    if (lv.filter(x => x === 1).length !== 1) fail(`L4 /book: ${lv.filter(x => x === 1).length} h1`)
    for (let i = 1; i < lv.length; i++) if (lv[i] > lv[i - 1] + 1) fail(`L4 /book: skipped level h${lv[i - 1]}->h${lv[i]}`)
    const robots = meta(h.slice(0, h.indexOf('</head>')), 'robots') || ''
    const noindex = /noindex/i.test(robots)
    const sm = await (await fetch(`${BASE}/sitemap.xml`)).text()
    if (noindex && sm.includes('/book')) fail('L4 /book is noindex but listed in the sitemap')
    const rb = await (await fetch(`${BASE}/robots.txt`)).text()
    if (noindex && /Disallow:\s*\/book/i.test(rb)) fail('L4 /book is noindex AND disallowed in robots.txt')
    const llms = await (await fetch(`${BASE}/llms.txt`)).text()
    if (noindex && llms.includes('/book')) fail('L4 /book is noindex but listed in llms.txt')
  }
}

// ── sitemap/llms hygiene ───────────────────────────────────────────────────
{
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text()
  for (const loc of [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])) {
    const p = loc.replace(CANON, '') || '/'
    const res = await fetch(BASE + p, { redirect: 'manual' })
    if (res.status !== 200) { fail(`sitemap lists a ${res.status} URL: ${loc}`); continue }
    const body = await res.text(), hd = body.slice(0, body.indexOf('</head>'))
    if (/noindex/i.test(meta(hd, 'robots') || '')) fail(`sitemap lists a noindex URL: ${loc}`)
    const canon = (hd.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/) || [])[1]
    if (canon && canon !== loc) fail(`sitemap URL not self-canonical: ${loc}`)
  }
}

for (const w of warns) console.warn('WARN  ' + w)
for (const f of fails) console.error('FAIL  ' + f)
console.log(`\n${ROUTES.length} routes - ${fails.length} failures, ${warns.length} warnings`)
process.exit(fails.length ? 1 : 0)
