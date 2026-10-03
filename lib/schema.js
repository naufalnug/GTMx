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
  // NOTE: no `sameAs` yet. The only external profile in the repo is the
  // founder's personal LinkedIn, which belongs on the Person node, and no
  // LinkedIn company page URL exists. <!-- NEEDS INPUT: company profile URLs -->
  // NOTE: no `alternateName`. The brief allows approved variants only, and
  // none have been approved. <!-- NEEDS INPUT: approved name variants -->
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
