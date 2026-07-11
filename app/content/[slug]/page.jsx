import { notFound } from 'next/navigation'
import Navbar from '../../../components/home/Navbar'
import Footer from '../../../components/home/Footer'
import { getPublishedArticles, getPublishedArticleBySlug } from '../../../lib/articles'
import { pageMetadata, absoluteUrl, SITE_URL, SITE_NAME } from '../../../lib/seo'
import { looksLikeHtml, mdToHtml, sanitizeHtml } from '../../../lib/richtext'
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

  const title = article.metaTitle || `${article.title} | GTMx`
  const description = article.metaDescription || article.excerpt
  const image = article.ogImage || article.coverImage || undefined

  const meta = pageMetadata({
    path: `/content/${article.slug}`,
    title,
    description,
    image,
    imageAlt: article.coverAlt || article.title,
    openGraph: {
      title: article.metaTitle || article.title,
      description,
      type: 'article',
      publishedTime: article.date,
    },
  })
  // Editor-supplied canonical override (e.g. when the post is syndicated from
  // elsewhere). og:url intentionally stays on this page's own URL.
  if (article.canonicalUrl) {
    meta.alternates = { ...meta.alternates, canonical: article.canonicalUrl }
  }
  return meta
}

// Every article page ships BlogPosting + BreadcrumbList; FAQPage is added when
// the post has FAQs, and any editor-supplied custom schema is layered on last.
function buildSchemas(article, url) {
  const image = article.ogImage || article.coverImage
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.metaDescription || article.excerpt,
      ...(image ? { image: [image] } : {}),
      datePublished: article.date,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      ...(article.tags.length ? { keywords: article.tags.join(', ') } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/content') },
        { '@type': 'ListItem', position: 3, name: article.title, item: url },
      ],
    },
  ]
  if (article.faqs.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }
  if (article.customSchema) {
    schemas.push(...(Array.isArray(article.customSchema) ? article.customSchema : [article.customSchema]))
  }
  return schemas
}

// `</script>`-safe JSON-LD serialization.
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')

export default async function ArticlePage({ params }) {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)
  if (!article) notFound()

  const url = absoluteUrl(`/content/${article.slug}`)
  const schemas = buildSchemas(article, url)

  // WYSIWYG posts are stored as HTML (sanitized again on render, so rows that
  // predate save-time sanitization are covered); legacy posts hold the old
  // lightweight-markdown format and are upgraded here.
  const bodyHtml = looksLikeHtml(article.body)
    ? sanitizeHtml(article.body)
    : mdToHtml(article.body)

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      ))}
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
                <img src={article.coverImage} alt={article.coverAlt || article.title} />
              </div>
            )}

            <div
              className="article-page__body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {article.faqs.length > 0 && (
              <section className="article-page__faqs">
                <h2 className="article-page__faqs-title">Frequently asked questions</h2>
                {article.faqs.map((f, i) => (
                  <details key={i} className="article-page__faq">
                    <summary>{f.question}</summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
              </section>
            )}

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
