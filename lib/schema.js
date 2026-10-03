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

export const organizationSchema = {
  '@context': 'https://schema.org',
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
export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: FOUNDER_NAME,
  jobTitle: FOUNDER_JOB_TITLE,
  url: `${SITE_URL}/about#founder`,
  // Already published on the site (components/home/Founder.jsx), so this
  // discloses nothing new. <!-- NEEDS INPUT: confirm headshot use in schema -->
  image: `${SITE_URL}/founder-headshot.jpg`,
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

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
  description: BRAND_DEFINITION,
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
}
