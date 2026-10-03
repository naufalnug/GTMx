import Navbar from '../../components/home/Navbar'
import { formatArticleDate } from '../../lib/articles'
import JsonLd from '../../components/JsonLd'
import { baseNodes, graph, webPageNode, breadcrumbNode } from '../../lib/schema'
import { SITE_URL } from '../../lib/seo'
import Footer from '../../components/home/Footer'
import { getPublishedArticles } from '../../lib/articles'
import { pageMetadata } from '../../lib/seo'
import '../home.css'
import './page.css'

// Revalidate the static shell periodically so newly published CMS posts appear.
export const revalidate = 60

export const metadata = pageMetadata({
  path: '/content',
  title: 'GTM & AI Content | GTMx',
  description: 'Practical insights on GTM engineering, AI-powered outbound, and pipeline building for B2B tech companies.',
})

export default async function ContentPage() {
  const articles = await getPublishedArticles()

  return (
    <>
      <JsonLd
        data={graph([
          ...baseNodes,
          webPageNode({
            url: `${SITE_URL}/content`,
            name: 'GTM Engineering and Outbound Blog',
            description: 'Practical breakdowns on outbound engineering, AI-powered pipeline building, and building a repeatable revenue engine.',
            type: 'CollectionPage',
          }),
          breadcrumbNode(`${SITE_URL}/content`, [
            ['Home', SITE_URL],
            ['Blog', `${SITE_URL}/content`],
          ]),
        ])}
      />
      <Navbar />
      <div className="dd">
        <main className="section blog">
          <div className="sec-head blog__head">
            <span className="blog__eyebrow">GTM &amp; AI insights.</span>
            {/* Real <h1> for the standalone blog index (no hero h1 above it).
                Keeps the .h2 class so the styling is unchanged; only the
                semantic level moves from h2 → h1 to fix heading order / SEO.
                The old tagline "GTM & AI insights." is not deleted -- it moves
                into the eyebrow above, so the h1 can name the topic instead. */}
            <h1 className="h2">GTM Engineering and Outbound <span className="hl">Blog</span></h1>
            <p className="sec-lede">
              Practical breakdowns on outbound engineering, AI-powered pipeline building,
              and what it actually takes to build a repeatable revenue engine.
            </p>
          </div>

          <div className="blog__grid">
            {articles.map((article, i) => (
              <a
                key={article.slug}
                href={`/content/${article.slug}`}
                className={'blog-card blog-card--' + ((i % 3) + 1)}
              >
                {article.coverImage && (
                  <div className="blog-card__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.coverImage}
                      alt={article.coverAlt || ''}
                      width={1200}
                      height={630}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="blog-card__tags">
                  {article.tags.map(tag => (
                    <span key={tag} className="blog-card__tag">{tag}</span>
                  ))}
                </div>
                {/* h2 (was h3) so the index has no skipped heading level under
                    the page h1. Class unchanged → identical styling. */}
                <h2 className="blog-card__title">{article.title}</h2>
                <p className="blog-card__excerpt">{article.excerpt}</p>
                {formatArticleDate(article.date) && (
                  <time className="blog-card__date" dateTime={article.date}>
                    {formatArticleDate(article.date)}
                  </time>
                )}
              </a>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
