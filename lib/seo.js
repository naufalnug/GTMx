/**
 * Single source of truth for the canonical origin and per-page SEO metadata.
 *
 * Everything that emits a public URL — canonical tags, og:url, and the XML
 * sitemap — flows through here so the host, protocol, and trailing-slash policy
 * live in exactly one place and can never drift apart. The live site is served
 * on the non-www, https origin below; `next.config.js` leaves `trailingSlash`
 * at its default (false), so canonical paths carry no trailing slash.
 */

export const SITE_URL = 'https://gtmx.run';
export const SITE_NAME = 'GTMx';

// X/Twitter handle for twitter:site / twitter:creator. No account exists yet —
// keep null so those tags are omitted cleanly rather than emitted empty.
export const TWITTER_HANDLE = null;

// Default social-share image, as a root-relative path (resolved to an absolute
// URL via `metadataBase`) or an absolute URL. No wide raster asset ships yet —
// SVGs aren't rendered as card images by X — so this stays null and cards
// degrade to `summary`. Drop in e.g. '/og.png' to enable large-image cards
// site-wide; individual pages can override via the `image` option.
export const DEFAULT_OG_IMAGE = null;

/**
 * Resolve an internal path to an absolute, canonical-host URL.
 *
 * Strips query strings and hash fragments (so UTM/tracking variants don't
 * fragment indexing), collapses duplicate slashes, and removes any trailing
 * slash (except the root). Returns the bare origin for the homepage so it
 * matches the sitemap's root entry exactly.
 */
export function absoluteUrl(path = '/') {
  let p = String(path).trim();
  // Drop hash and query — canonical URLs must be free of tracking noise.
  p = p.split('#')[0].split('?')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p === '/' ? SITE_URL : `${SITE_URL}${p}`;
}

/**
 * Build a page's Metadata with a self-referencing canonical and a matching
 * og:url. Because the App Router shallow-merges metadata, every indexable page
 * calls this so its own canonical/og:url always win over the inherited defaults
 * instead of falling back to the homepage.
 *
 * @param {object} opts
 * @param {string} opts.path        Route path for this page (e.g. '/services/automated-outbound').
 * @param {string} [opts.title]
 * @param {string} [opts.description]
 * @param {object} [opts.openGraph] Per-page openGraph overrides (e.g. type, publishedTime, a shorter description).
 * @param {string} [opts.image]     Per-page social image (root-relative or absolute); falls back to DEFAULT_OG_IMAGE.
 * @param {string} [opts.imageAlt]  Alt text for the social image; falls back to the page title.
 * @param {object} [opts.twitter]   Per-page twitter overrides, merged last.
 * @param {object} [opts.rest]      Any other Metadata fields (robots, …) passed through untouched.
 */
export function pageMetadata({ path, title, description, image, imageAlt, openGraph = {}, twitter = {}, ...rest } = {}) {
  const url = absoluteUrl(path);
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  // Next resolves root-relative image paths to absolute URLs via metadataBase,
  // so both og:image and twitter:image come out fully qualified.
  const images = ogImage ? [{ url: ogImage, alt: imageAlt ?? title }] : undefined;

  const og = {
    siteName: SITE_NAME,
    type: 'website',
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(images ? { images } : {}),
    ...openGraph,
    url,
  };

  // Mirror the resolved OG title/description so the card matches the share
  // preview, falling back to the page's <title>/meta description. Image, card
  // type, and handle tags are only emitted when their value actually exists,
  // so absent fields never render as empty or duplicate tags.
  const twitterTitle = og.title ?? title;
  const twitterDescription = og.description ?? description;
  const twitterCard = {
    card: images ? 'summary_large_image' : 'summary',
    ...(twitterTitle !== undefined ? { title: twitterTitle } : {}),
    ...(twitterDescription !== undefined ? { description: twitterDescription } : {}),
    ...(images ? { images } : {}),
    ...(TWITTER_HANDLE ? { site: TWITTER_HANDLE, creator: TWITTER_HANDLE } : {}),
    ...twitter,
  };

  return {
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...rest,
    alternates: { canonical: url },
    openGraph: og,
    twitter: twitterCard,
  };
}

/**
 * Build a Schema.org `FAQPage` JSON-LD object from the SAME Q&A array a page
 * already renders, so the structured data can never drift from the visible
 * text. Accepts either `{ question, answer }` (the flat homepage shape) or
 * `{ q, a }` (the service/tab shape); entries missing either field are dropped.
 *
 * Returns `null` when there are no valid pairs, so callers emit no `<script>`
 * rather than an empty, invalid `FAQPage`. Answer values are plain strings here,
 * so `JSON.stringify` handles all escaping; pass already-rendered text only.
 *
 * @param {Array<{question?: string, answer?: string, q?: string, a?: string}>} items
 * @returns {{'@context': string, '@type': 'FAQPage', mainEntity: object[]} | null}
 */
export function faqPageJsonLd(items = []) {
  const mainEntity = (items ?? [])
    .map(item => ({ question: item.question ?? item.q, answer: item.answer ?? item.a }))
    .filter(qa => qa.question && qa.answer)
    .map(qa => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: { '@type': 'Answer', text: qa.answer },
    }));

  if (mainEntity.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
