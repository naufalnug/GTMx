/**
 * Centralized Schema.org JSON-LD builders. Site-wide entities (Organization,
 * WebSite) are emitted once from the root layout as a single @graph; per-page
 * entities (Service, BreadcrumbList) are built from each route's real data.
 * Everything resolves URLs through `absoluteUrl`, so hosts/@ids stay canonical
 * and consistent, and entities cross-reference by stable @id.
 */

import { SITE_URL, SITE_NAME, absoluteUrl } from './seo';

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Brand logo shipped in /public. No verified social profiles or separate legal
// entity exist yet, so `sameAs` is intentionally omitted rather than fabricated;
// add the official profile URLs here once they exist.
function organization() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/logo.svg'),
    description:
      'Go-to-market engineering for B2B tech companies — outbound, RevOps, and search systems built into one revenue engine.',
  };
}

// No on-site search endpoint exists, so no SearchAction is emitted.
function website() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** Site-wide entity graph — emit once, in the root layout. */
export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [organization(), website()],
  };
}

/**
 * Service offered on a service detail page, linked to the Organization.
 * @param {{slug: string, name: string, blurb: string}} service
 */
export function serviceSchema(service) {
  if (!service) return null;
  const url = absoluteUrl(`/services/${service.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.name,
    description: service.blurb,
    serviceType: service.name,
    url,
    areaServed: 'Worldwide',
    provider: { '@id': ORGANIZATION_ID },
  };
}

/**
 * Ordered BreadcrumbList from a true navigation trail. Entries missing a name
 * or path are dropped; returns null for an empty/trivial trail so callers emit
 * nothing rather than an invalid breadcrumb.
 * @param {Array<{name: string, path: string}>} trail
 */
export function breadcrumbSchema(trail) {
  const items = (trail ?? []).filter(step => step && step.name && step.path);
  if (items.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}
