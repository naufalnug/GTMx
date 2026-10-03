import { notFound } from 'next/navigation'
import Navbar from '../../../components/home/Navbar'
import Footer from '../../../components/home/Footer'
import { getPublishedArticles, getPublishedArticleBySlug, formatArticleDate } from '../../../lib/articles'
import { pageMetadata, absoluteUrl, SITE_URL, SITE_NAME } from '../../../lib/seo'
import { authorRef, ORG_ID, FOUNDER_NAME } from '../../../lib/schema'

/* A modification date is only emitted when the CMS actually recorded one AND it is
   later than the published date. Defaulting it to the published date would assert
   an edit that never happened; emitting an earlier one is invalid. */
function realModifiedTime(article) {
  if (!article.updatedAt || !article.date) return null
  return new Date(article.updatedAt) > new Date(article.date) ? article.updatedAt : null
}
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
  const modifiedTime = realModifiedTime(article)
  const image = article.ogImage || article.coverImage || undefined

  const meta = pageMetadata({
    path: `/content/${article.slug}`,
    title,
    description,
    image,
    imageAlt: article.coverAlt || article.title,
    openGraph: {
      // No `title` override, so og:title and twitter:title inherit `title` (D1).
      description,
      type: 'article',
      ...(article.date ? { publishedTime: article.date } : {}),
      // Only when a genuine, later modification exists. Never defaulted to the
      // published date, which would assert an edit that never happened.
      ...(modifiedTime ? { modifiedTime } : {}),
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
      ...(article.date ? { datePublished: article.date } : {}),
    ...(realModifiedTime(article) ? { dateModified: realModifiedTime(article) } : {}),
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      author: authorRef,
      publisher: { '@id': ORG_ID },
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

  // Related posts are chosen by shared tag, not by date (Phase 4 rule). With three
  // posts live, each one ends up linking to the other two.
  const allArticles = await getPublishedArticles()
  const related = allArticles
    .filter(a => a.slug !== article.slug)
    .map(a => ({ a, shared: a.tags.filter(t => article.tags.includes(t)).length }))
    .sort((x, y) => y.shared - x.shared)
    .slice(0, 2)
    .map(x => x.a)

  // Tag -> service, so every post also links to the service it is about.
  const serviceLink = article.tags.some(t => /revops|crm/i.test(t))
    ? { href: '/services/revops', name: 'RevOps' }
    : article.tags.some(t => /seo|aeo|search|content/i.test(t))
      ? { href: '/services/seo-aeo', name: 'SEO + AEO' }
      : { href: '/services/automated-outbound', name: 'Automated Outbound' }

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
              {/* Visible byline. A <p>, never a heading, linked to the Person
                  node on /about (decision D5). */}
              <p className="article-page__byline">
                By <a href="/about#founder">{FOUNDER_NAME}</a>
              </p>
              {formatArticleDate(article.date) && (
                <time className="article-page__date">{formatArticleDate(article.date)}</time>
              )}
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

            <section className="article-page__related">
              <h2 className="article-page__related-title">Keep reading</h2>
              <ul className="article-page__related-list">
                {related.map(r => (
                  <li key={r.slug}>
                    <a href={`/content/${r.slug}`}>{r.title}</a>
                  </li>
                ))}
                <li>
                  <a href={serviceLink.href}>
                    How GTMx builds {serviceLink.name} systems
                  </a>
                </li>
              </ul>
            </section>

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
