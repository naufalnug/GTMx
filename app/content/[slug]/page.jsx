import { notFound } from 'next/navigation'
import ContentNavbar from '../../../components/ContentNavbar'
import GlowButton from '../../../components/ui/GlowButton'
import { articles } from '../../../data/articles'
import './page.css'

export function generateStaticParams() {
  return articles.map(article => ({
    slug: article.slug,
  }))
}

export function generateMetadata({ params }) {
  const article = articles.find(a => a.slug === params.slug)
  if (!article) return {}

  return {
    title: `${article.title} | GTMx`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
    },
  }
}

export default function ArticlePage({ params }) {
  const article = articles.find(a => a.slug === params.slug)
  if (!article) notFound()

  const paragraphs = article.body.split('\n\n')

  return (
    <>
      <ContentNavbar />
      <main className="article">
        <article className="article__inner">
          <div className="article__header">
            <a href="/content" className="article__back">&larr; Back to Content</a>
            <div className="article__tags">
              {article.tags.map(tag => (
                <span key={tag} className="article__tag">{tag}</span>
              ))}
            </div>
            <h1 className="article__title">{article.title}</h1>
            <time className="article__date">
              {new Date(article.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>

          <div className="article__body">
            {paragraphs.map((p, i) => {
              if (p.startsWith('## ')) {
                return <h2 key={i} className="article__h2">{p.replace('## ', '')}</h2>
              }
              if (p.startsWith('- **')) {
                const items = p.split('\n')
                return (
                  <ul key={i} className="article__list">
                    {items.map((item, j) => (
                      <li key={j} className="article__list-item"
                        dangerouslySetInnerHTML={{ __html: item.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                      />
                    ))}
                  </ul>
                )
              }
              return (
                <p key={i} className="article__paragraph"
                  dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              )
            })}
          </div>

          <div className="article__cta">
            <p className="article__cta-text">
              Ready to build your US revenue engine?
            </p>
            <GlowButton href="/#book" size="md">
              {'>>> Book a Free GTM Audit'}
            </GlowButton>
          </div>
        </article>
      </main>
    </>
  )
}
