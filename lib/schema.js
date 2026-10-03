/* ──────────────────────────────────────────────
   GTMx — lib/schema.js
   Sitewide JSON-LD entity graph. Organization and WebSite are emitted
   once from the root layout so every route carries them, and both have
   stable @ids that other schema blocks can reference instead of
   duplicating the publisher object.
   ────────────────────────────────────────────── */

import { SITE_URL, SITE_NAME } from './seo'
import { BRAND_DEFINITION } from './site-facts'

export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
/** Reserved for the founder Person node on /about. NOT emitted yet —
 *  decision D5 holds Person schema until the founder's surname is supplied. */
export const PERSON_ID = `${SITE_URL}/about#founder`

export const CONTACT_EMAIL = 'hello@gtmx.run'
export const LEGAL_NAME = 'GTMx LLC'

/** Supplied by the site owner, 2026-10-03. Not inferred from anything in the repo. */
export const FOUNDER_NAME = 'Joshua Solomon'
export const FOUNDER_JOB_TITLE = 'Founder'
/** Verified before use, per the sameAs rule:
 *  company page -> HTTP 200; personal profile -> HTTP 999, which is LinkedIn's
 *  standard anti-bot status and counts as verified for linkedin.com only. */
export const COMPANY_LINKEDIN = 'https://www.linkedin.com/company/gtmx-run/'
export const FOUNDER_LINKEDIN = 'https://www.linkedin.com/in/youhavefoundjoshua/'

export const organizationNode = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  legalName: LEGAL_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/gtmx-emblem-cream.png`,
  description: BRAND_DEFINITION,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: CONTACT_EMAIL,
    url: `${SITE_URL}/contact`,
  },
  sameAs: [COMPANY_LINKEDIN],
  // NOTE: still no `alternateName`. The brief allows approved variants only and
  // none have been approved. <!-- NEEDS INPUT: approved name variants -->
  // <!-- NEEDS INPUT: Clutch / G2 / Crunchbase / Clay directory URLs for sameAs -->
}

/** Full Person node. Lives on /about, which is where PERSON_ID resolves. */
export const personNode = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: FOUNDER_NAME,
  jobTitle: FOUNDER_JOB_TITLE,
  url: `${SITE_URL}/about#founder`,
  // Already published on the site (components/home/Founder.jsx), so this
  // discloses nothing new. <!-- NEEDS INPUT: confirm headshot use in schema -->
  image: `${SITE_URL}/founder-headshot.webp`,
  worksFor: { '@id': ORG_ID },
  sameAs: [FOUNDER_LINKEDIN],
}

/** Compact author node for BlogPosting. Carries @type and name so the node is
 *  self-contained on the post page, while the @id ties it to the /about Person. */
export const authorRef = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: FOUNDER_NAME,
  url: `${SITE_URL}/about#founder`,
}

export const websiteNode = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
  description: BRAND_DEFINITION,
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
}

/* ──────────────────────────────────────────────
   Graph builders.

   Each page emits exactly ONE <script type="application/ld+json"> holding a
   single @graph. Organization and WebSite are included in that graph rather
   than in separate layout scripts, so every @id reference resolves inside the
   same graph on every page.

   Every builder derives from the same data that renders the visible page, so
   the markup cannot drift from the content. Nothing emits an empty property,
   a placeholder, or a field that was never supplied (no areaServed, no
   priceRange, no telephone, no address, no foundingDate, and never any
   aggregateRating or review).
   ────────────────────────────────────────────── */

/** Wraps nodes in a single @graph. Nullish nodes are dropped. */
export function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }
}

/** The two nodes every page carries. */
export const baseNodes = [organizationNode, websiteNode]

export function webPageNode({ url, name, description, type = 'WebPage', extra = {} }) {
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    ...(description ? { description } : {}),
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    ...extra,
  }
}

/** trail: [[name, absoluteUrl], ...]. Last entry must be the current page. */
export function breadcrumbNode(url, trail) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: trail.map(([name, itemUrl], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: itemUrl,
    })),
  }
}

/** items: [{question, answer}]. MUST be only FAQs visible in the server HTML. */
export function faqPageNode(url, items) {
  if (!items || items.length === 0) return null
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faqpage`,
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

/** Self-contained Service node, so referencing it from another page resolves. */
export function serviceNode({ slug, name, description }) {
  const url = `${SITE_URL}/services/${slug}`
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name,
    url,
    ...(description ? { description } : {}),
    serviceType: 'Go-to-Market Engineering',
    provider: { '@id': ORG_ID },
  }
}
