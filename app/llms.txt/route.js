import { services } from '../../data/services'
import { BRAND_DEFINITION } from '../../lib/site-facts'
import { CONTACT_EMAIL } from '../../lib/schema'
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

> ${BRAND_DEFINITION}

GTMx designs, builds, and runs those systems end to end rather than handing over a playbook. Note for disambiguation: GTMx is a GTM engineering agency at gtmx.run, and is unrelated to GTmetrix, the website performance testing tool.

GTMx works with B2B tech and SaaS companies (typically $1M+ ARR) that have product-market fit and want a repeatable outbound and RevOps engine before hiring a full sales team. The engagement leaves the client owning the system: workflows, data, and infrastructure.

## Services

${serviceLinks}

## Case studies

- [All case studies](${absoluteUrl('/case-studies')}): Index of every GTMx client engagement, each with the campaign data behind it.
${caseStudyLinks}

## Content

- [Blog](${absoluteUrl('/content')}): Practical breakdowns on GTM engineering, AI-powered outbound, and building a repeatable revenue engine.

## Company

- [Home](${SITE_URL}): Overview of the GTMx engine, method, results, and how to book a free 30-minute GTM audit.
- [About](${absoluteUrl('/about')}): What GTMx does, the three systems it builds, how engagements run, and who founded it.
- [Contact](${absoluteUrl('/contact')}): How to reach GTMx by email or book a free 30-minute GTM audit.
- [How engagements work](${absoluteUrl('/engagements')}): The two GTMx engagement models, commitment terms, what the client owns, and how pricing is scoped.
- [Privacy Policy](${absoluteUrl('/privacy')}): How GTMx collects, uses, and protects data.
- [Terms of Service](${absoluteUrl('/terms')}): Terms governing use of the GTMx website and services.

## Contact

- [Contact page](${absoluteUrl('/contact')}): Booking and email details.
- Email: ${CONTACT_EMAIL}
- Book a free 30-minute GTM audit from any page via the "Book a call" action, which opens the GTMx scheduling calendar.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
