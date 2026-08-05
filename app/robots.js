import { absoluteUrl } from '../lib/seo'

export const dynamic = 'force-static'

// Private/utility areas kept out of the index for every crawler: the admin CMS,
// all API routes, and the tokenized client dashboards (which contain private
// campaign data behind a per-client token).
const DISALLOW = ['/admin', '/api/', '/dashboard']

// Major AI crawlers, listed explicitly so their access is intentional and
// documented rather than merely implied by the wildcard rule. They get the
// same access as everyone else today; keeping them as a named rule means a
// future tightening of `*` can't silently change their behaviour.
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
]

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
