#!/usr/bin/env node
/* Heading-structure guard. Fetches every in-scope route from a running
   server and fails loudly on anything that breaks the document outline.
   Usage: npm run verify:headings            (expects localhost:3000)
          BASE=https://gtmx.run npm run verify:headings */

const BASE = process.env.BASE || 'http://localhost:3000'
const ROUTES = ['/', '/services/automated-outbound', '/services/revops', '/services/seo-aeo',
  '/content', '/content/why-your-sales-playbook-wont-scale',
  '/content/using-ai-to-build-your-first-outbound-pipeline',
  '/content/the-250k-mistake-hiring-us-vp-sales-too-early',
  '/case-studies/opensponsorship', '/case-studies/strategy-achievers',
  '/case-studies/metatron-concepts', '/case-studies/united-safety-training',
  '/privacy', '/terms']
const GENERIC = ["The problem.", "What's included.", "How it works.", "Fair questions."]
const MOCKUP = /\.clay|\.json|_audit|_tracker|_scoring|_performance/i
const NUM = /(?<![A-Za-z0-9])\$?\d[\d,]*(?:\.\d+)?[KM]?\+?/g
const ORDINAL = /^\d{1,2}\.\s/   // numbered legal sections: not a stat
const strip = s => s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&apos;/g, "'")
  .replace(/&quot;/g, '"').replace(/&mdash;/g, '—').replace(/&larr;/g, '←')
  .replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()

const fails = [], warns = []
const fail = (r, m) => fails.push(`${r}: ${m}`)

for (const route of ROUTES) {
  const res = await fetch(BASE + route)
  if (!res.ok) { fail(route, `HTTP ${res.status}`); continue }
  const html = (await res.text()).replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
  const heads = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map(m => ({ lvl: +m[1], text: strip(m[2]) }))
  const body = strip(html.replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, ''))
  const isSvc = route.startsWith('/services/')
  const isVidify = route === '/case-studies/metatron-concepts'

  const h1s = heads.filter(h => h.lvl === 1).length
  if (h1s !== 1) fail(route, `expected exactly 1 h1, found ${h1s}`)

  const seen = new Map()   // "parentKey|lvl|text" -> count
  const stack = []
  for (const [i, h] of heads.entries()) {
    const t = h.text
    if (i > 0 && h.lvl > heads[i - 1].lvl + 1) fail(route, `skipped level: h${heads[i - 1].lvl} "${heads[i - 1].text}" -> h${h.lvl} "${t}"`)
    if (!t || !/[A-Za-z0-9]/.test(t)) fail(route, `empty or punctuation-only h${h.lvl}: "${t}"`)
    if (/[A-Za-z],[A-Za-z]|[a-z]\.[a-z]/.test(t) && !MOCKUP.test(t)) fail(route, `missing space after punctuation in h${h.lvl}: "${t}"`)
    if (/seo \+ aeo|revops/.test(t) && !/SEO \+ AEO|RevOps/.test(t)) fail(route, `lowercase service name in h${h.lvl}: "${t}"`)
    if (/^\$/.test(t) || /\+$/.test(t) || /^[\d,.]+$/.test(t)) fail(route, `stat used as h${h.lvl}: "${t}"`)
    if (MOCKUP.test(t)) fail(route, `mockup label used as h${h.lvl}: "${t}"`)
    if (isSvc && h.lvl === 2 && GENERIC.includes(t)) fail(route, `generic service h2 still present: "${t}"`)
    if ((isVidify || /Vidify/i.test(t)) && /\d/.test(t)) fail(route, `Vidify number in h${h.lvl}: "${t}"`)

    while (stack.length && stack[stack.length - 1].lvl >= h.lvl) stack.pop()
    const key = `${stack.map(s => s.text).join('>')}|${h.lvl}|${t.toLowerCase()}`
    if (seen.has(key)) fail(route, `duplicate h${h.lvl} "${t}" under the same parent`)
    seen.set(key, 1)
    stack.push(h)

    if (!ORDINAL.test(t)) {
      for (const n of t.match(NUM) || []) {
        if (!body.includes(n)) warns.push(`${route}: number "${n}" in h${h.lvl} "${t}" not found in page body`)
      }
    }
  }
}

for (const w of warns) console.warn('WARN  ' + w)
for (const f of fails) console.error('FAIL  ' + f)
console.log(`\n${ROUTES.length} routes checked — ${fails.length} failures, ${warns.length} warnings`)
process.exit(fails.length ? 1 : 0)
