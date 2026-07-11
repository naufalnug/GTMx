import { notFound } from 'next/navigation'
import Navbar from '../../../components/home/Navbar'
import Footer from '../../../components/home/Footer'
import { getPublishedArticles, getPublishedArticleBySlug } from '../../../lib/articles'
import { pageMetadata } from '../../../lib/seo'
import '../../home.css'
import './page.css'

// Regenerate published posts on-demand; new CMS slugs render the first time
// they're requested (dynamicParams defaults to true).
export const revalidate = 60

export async function generateStaticParams() {
  const articles = await getPublishedArticles()
  return articles.map(article => ({
    slug: article.slug,
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)
  // No canonical for an unknown slug — the page itself 404s (notFound below).
  if (!article) return {}

  return pageMetadata({
    path: `/content/${article.slug}`,
    title: `${article.title} | GTMx`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
    },
  })
}

export default async function ArticlePage({ params }) {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)
  if (!article) notFound()

  const paragraphs = article.body.split('\n\n')

  // Inline formatting for a text run: image markdown, then bold. URLs are
  // restricted to http(s) so a stray "javascript:" can't slip into the src.
  const inlineHtml = (s) =>
    s
      .replace(
        /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
        (_, alt, url) =>
          `<img class="article-page__img" src="${url}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />`
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  return (
    <>
      <Navbar />
      <div className="dd">
        <main className="article-page">
          <article className="article-page__inner">
            <div className="article-page__header">
              <a href="/content" className="article-page__back">&larr; Back to Blog</a>
              <div className="article-page__tags">
                {article.tags.map(tag => (
                  <span key={tag} className="article-page__tag">{tag}</span>
                ))}
              </div>
              <h1 className="article-page__title">{article.title}</h1>
              <time className="article-page__date">
                {new Date(article.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>

            {article.coverImage && (
              <div className="article-page__cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.coverImage} alt={article.title} />
              </div>
            )}

            <div className="article-page__body">
              {paragraphs.map((p, i) => {
                if (p.startsWith('## ')) {
                  return <h2 key={i} className="article-page__h2">{p.replace('## ', '')}</h2>
                }
                // A paragraph that is only an image → block-level figure.
                if (/^!\[[^\]]*\]\(https?:\/\/[^\s)]+\)$/.test(p.trim())) {
                  return (
                    <figure key={i} className="article-page__figure"
                      dangerouslySetInnerHTML={{ __html: inlineHtml(p.trim()) }}
                    />
                  )
                }
                if (p.startsWith('- **')) {
                  const items = p.split('\n')
                  return (
                    <ul key={i} className="article-page__list">
                      {items.map((item, j) => (
                        <li key={j} className="article-page__list-item"
                          dangerouslySetInnerHTML={{ __html: inlineHtml(item.replace(/^- /, '')) }}
                        />
                      ))}
                    </ul>
                  )
                }
                return (
                  <p key={i} className="article-page__paragraph"
                    dangerouslySetInnerHTML={{ __html: inlineHtml(p) }}
                  />
                )
              })}
            </div>

            <div className="article-page__cta">
              <p className="article-page__cta-text">Ready to build your revenue engine?</p>
              <a href="/#book" className="btn-lg btn-lg--dark">
                Book a free GTM audit
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </a>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  )
}
