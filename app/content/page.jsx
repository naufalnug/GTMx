import ContentNavbar from '../../components/ContentNavbar'
import { articles } from '../../data/articles'
import './page.css'

export const metadata = {
  title: 'GTM & AI Content | GTMx',
  description: 'Practical insights on GTM engineering, AI-powered outbound, and APAC-to-US expansion for B2B tech companies.',
}

export default function ContentPage() {
  return (
    <>
      <ContentNavbar />
      <main className="content-listing">
        <div className="content-listing__inner">
          <div className="content-listing__header">
            <span className="content-listing__label">// content</span>
            <h1 className="content-listing__title">GTM &amp; AI INSIGHTS</h1>
            <p className="content-listing__desc">
              Practical breakdowns on outbound engineering, AI-powered pipeline building,
              and what it actually takes for APAC companies to win in the US.
            </p>
          </div>

          <div className="content-listing__grid">
            {articles.map(article => (
              <a
                key={article.slug}
                href={`/content/${article.slug}`}
                className="content-listing__card"
              >
                <div className="content-listing__tags">
                  {article.tags.map(tag => (
                    <span key={tag} className="content-listing__tag">{tag}</span>
                  ))}
                </div>
                <h2 className="content-listing__card-title">{article.title}</h2>
                <p className="content-listing__card-excerpt">{article.excerpt}</p>
                <span className="content-listing__card-date">
                  {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
