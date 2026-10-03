import { pageMetadata, SITE_URL } from '../../lib/seo'
import JsonLd from '../../components/JsonLd'
import { baseNodes, graph, webPageNode, breadcrumbNode } from '../../lib/schema'

/* noindex, follow (decision D5). The page duplicates the booking section already
   on / and the three service pages, so it should not compete with them in the
   index, but its links should still be followed. It is kept out of the sitemap and
   llms.txt, and is NOT disallowed in robots.txt: blocking it would stop a crawler
   ever reading this tag. */
export const metadata = {
  ...pageMetadata({
    path: '/book',
    title: 'Book a Free GTM Audit | GTMx',
    description:
      'Book a free 30-minute GTM audit with GTMx. We map what it takes to build your outbound, RevOps or search engine and show you where the pipeline is. No pitch.',
  }),
  robots: { index: false, follow: true },
}

export default function BookLayout({ children }) {
  return (
    <>
      <JsonLd
        data={graph([
          ...baseNodes,
          webPageNode({
            url: `${SITE_URL}/book`,
            name: 'Book a Free GTM Audit',
            description:
              'Book a free 30-minute GTM audit with GTMx. No pitch, no obligation.',
          }),
          breadcrumbNode(`${SITE_URL}/book`, [
            ['Home', SITE_URL],
            ['Book a Free GTM Audit', `${SITE_URL}/book`],
          ]),
        ])}
      />
      {children}
    </>
  )
}
