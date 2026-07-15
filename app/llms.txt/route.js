import { services } from '../../data/services'
import { caseStudies } from '../../data/caseStudies'
import { SITE_URL, absoluteUrl } from '../../lib/seo'

// Served at the domain root as /llms.txt (App Router maps the literal folder
// name). Generated from the same data that drives the pages, so every link
// resolves to a real 200 route and the file can't drift out of sync.
export const dynamic = 'force-static'

// Keep authored text free of em/en dashes (house style): reuse real page copy
// but normalise any dashes to commas so the summaries stay faithful and clean.
const clean = (s) => String(s).replace(/\s*[—–]\s*/g, ', ').replace(/\s+/g, ' ').trim()

export function GET() {
  const serviceLinks = services
    .map((s) => `- [${s.name}](${absoluteUrl(`/services/${s.slug}`)}): ${clean(s.blurb)}`)
    .join('\n')

  const caseStudyLinks = caseStudies
    .map((c) => `- [${c.company}](${absoluteUrl(`/case-studies/${c.slug}`)}): ${clean(c.headline)}`)
    .join('\n')

  const body = `# GTMx

> GTMx is a done-for-you GTM engineering agency. It designs, builds, and runs the outbound, RevOps, and search systems that turn a working B2B product into predictable, qualified pipeline.

GTMx works with B2B tech and SaaS companies (typically $1M+ ARR) that have product-market fit and want a repeatable outbound and RevOps engine before hiring a full sales team. The engagement leaves the client owning the system: workflows, data, and infrastructure.

## Services

${serviceLinks}

## Case studies

${caseStudyLinks}

## Content

- [Blog](${absoluteUrl('/content')}): Practical breakdowns on GTM engineering, AI-powered outbound, and building a repeatable revenue engine.

## Company

- [Home](${SITE_URL}): Overview of the GTMx engine, method, results, and how to book a free 30-minute GTM audit.
- [Privacy Policy](${absoluteUrl('/privacy')}): How GTMx collects, uses, and protects data.
- [Terms of Service](${absoluteUrl('/terms')}): Terms governing use of the GTMx website and services.

## Contact

- Book a free 30-minute GTM audit from any page via the "Book a call" action, which opens the GTMx scheduling calendar.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
