import { getPublishedArticles } from '../../lib/articles'
import { SITE_URL, SITE_NAME, absoluteUrl } from '../../lib/seo'
import { BRAND_DEFINITION } from '../../lib/site-facts'

export const revalidate = 300

const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/* Post dates are used exactly as they exist today. `article.date` is a string on
   the seed path and a Date object on the Neon path; `new Date()` handles both
   correctly via valueOf(), so the `[object Object]` bug that affects
   article:published_time does NOT affect this feed. */
function rfc822(d) {
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? null : date.toUTCString()
}

export async function GET() {
  const articles = await getPublishedArticles()

  const items = articles
    .map(a => {
      const url = absoluteUrl(`/content/${a.slug}`)
      const pub = rfc822(a.date)
      return [
        '    <item>',
        `      <title>${esc(a.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${esc(a.excerpt)}</description>`,
        pub ? `      <pubDate>${pub}</pubDate>` : '',
        ...a.tags.map(t => `      <category>${esc(t)}</category>`),
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} Blog</title>
    <link>${absoluteUrl('/content')}</link>
    <description>${esc(BRAND_DEFINITION)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl('/feed.xml')}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
