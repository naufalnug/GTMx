import { articles } from '../../data/articles'
import { services } from '../../data/services'
import { caseStudies } from '../../data/caseStudies'
import { SITE_NAME, absoluteUrl } from '../../lib/seo'

/**
 * Served at /llms.txt — a curated, machine-friendly map of the site for LLMs
 * and AI answer engines (the emerging llms.txt convention). Generated from the
 * same data sources as the sitemap and through `absoluteUrl`, so links stay
 * canonical and the file never drifts as services, posts, or case studies ship.
 */
export const dynamic = 'force-static'

const link = (title, path, description) =>
  `- [${title}](${absoluteUrl(path)}): ${description}`

function buildLlmsTxt() {
  const serviceLinks = services.map(s => link(s.name, `/services/${s.slug}`, s.blurb))
  const caseStudyLinks = caseStudies.map(c =>
    link(`${c.company} case study`, `/case-studies/${c.slug}`, c.headline),
  )
  const articleLinks = articles.map(a => link(a.title, `/content/${a.slug}`, a.excerpt))

  return `# ${SITE_NAME}

> GTMx builds and runs the outbound revenue engine that gets B2B tech companies their first qualified pipeline: cold email, LinkedIn outbound, RevOps, and search systems engineered into one go-to-market motion.

GTMx is a go-to-market engineering studio for B2B tech companies. We build, launch, and operate three connected systems: automated outbound, RevOps, and SEO/AEO. Engagements run on a 90-day initial build, after which clients keep the systems, workflows, and infrastructure in their own tools.

## Services

${serviceLinks.join('\n')}

## Case studies

${caseStudyLinks.join('\n')}

## Writing

${link('GTM & AI insights', '/content', 'Practical breakdowns on outbound engineering, AI-powered pipeline building, and GTM strategy for B2B tech companies.')}
${articleLinks.join('\n')}

## Company

${link('Privacy policy', '/privacy', 'How GTMx collects, uses, and protects your data.')}
${link('Terms of service', '/terms', 'The terms governing use of the GTMx website and services.')}
`
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
