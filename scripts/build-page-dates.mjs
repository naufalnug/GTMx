#!/usr/bin/env node
/* Writes data/page-dates.json: the last git commit date for each route's source
   files. The sitemap reads it so `lastmod` reflects when a page actually changed,
   instead of stamping build time on every URL (which is what it did before).

   Committed to the repo rather than run on the build server, because Vercel
   builds from a shallow clone where `git log` cannot see real history.
   Regenerate with `npm run sitemap:dates` whenever page content changes. */

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

/** route -> source files whose latest commit date defines the page */
const ROUTE_SOURCES = {
  '/': ['app/page.jsx', 'components/home/Hero.jsx', 'components/home/Services.jsx',
        'components/home/Method.jsx', 'components/home/Results.jsx', 'components/home/Founder.jsx',
        'components/home/Faq.jsx', 'components/home/Proof.jsx'],
  '/about': ['app/about/page.jsx'],
  '/contact': ['app/contact/page.jsx'],
  '/engagements': ['app/engagements/page.jsx'],
  '/case-studies': ['app/case-studies/page.jsx', 'data/caseStudies.js'],
  '/content': ['app/content/page.jsx'],
  '/services': ['app/services/[slug]/page.jsx', 'data/services.js'],
  '/case-study': ['app/case-studies/[slug]/page.jsx', 'data/caseStudies.js'],
}

function lastCommit(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { encoding: 'utf8' }).trim()
    return out || null
  } catch {
    return null
  }
}

const dates = {}
for (const [route, files] of Object.entries(ROUTE_SOURCES)) {
  const stamps = files.map(lastCommit).filter(Boolean).sort()
  // Omit entirely when it cannot be determined, rather than inventing a date.
  if (stamps.length) dates[route] = stamps[stamps.length - 1]
}

writeFileSync('data/page-dates.json', JSON.stringify(dates, null, 2) + '\n')
console.log(`page-dates.json written for ${Object.keys(dates).length} routes`)
for (const [r, d] of Object.entries(dates)) console.log(`  ${r.padEnd(16)} ${d}`)
