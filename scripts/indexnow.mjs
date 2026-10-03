#!/usr/bin/env node
/* IndexNow submission for gtmx.run. DRY RUN BY DEFAULT.

   IndexNow tells Bing, Yandex, Seznam and Naver that URLs changed, so they
   recrawl in minutes rather than days. Google does NOT participate.

   Usage:
     node scripts/indexnow.mjs            # prints what it WOULD submit, sends nothing
     node scripts/indexnow.mjs --submit   # actually submits

   The key is served from https://gtmx.run/${KEY}.txt, which is how the search
   engines verify you control the host. Do not delete that file. */

const KEY = '15a823976c9373de41f1bd54f56240db'
const HOST = 'gtmx.run'
const ORIGIN = `https://${HOST}`
const ENDPOINT = 'https://api.indexnow.org/IndexNow'
const SUBMIT = process.argv.includes('--submit')

/* Source of truth is the sitemap, so this can never drift from it. */
async function urlsFromSitemap(base) {
  const res = await fetch(`${base}/sitemap.xml`)
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`)
  const xml = await res.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
}

const base = process.env.BASE || ORIGIN
const urls = await urlsFromSitemap(base)
// Only ever submit canonical production URLs, even when reading a local sitemap.
const list = urls.map(u => u.replace(/^https?:\/\/[^/]+/, ORIGIN))

console.log(`${SUBMIT ? 'SUBMITTING' : 'DRY RUN - would submit'} ${list.length} URLs to IndexNow:`)
for (const u of list) console.log('  ' + u)

if (!SUBMIT) {
  console.log('\nNothing was sent. Re-run with --submit to actually notify IndexNow.')
  process.exit(0)
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: list }),
})
console.log(`IndexNow responded ${res.status} ${res.statusText}`)
process.exit(res.ok ? 0 : 1)
