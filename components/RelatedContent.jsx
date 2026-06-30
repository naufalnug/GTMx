/* ──────────────────────────────────────────────
   GTMx — components/RelatedContent.jsx
   Contextual internal links appended to each blog post: the
   service pages it relates to + other posts to keep reading.
   Server component; relatedness is resolved from tags at build
   time (lib/related.js). Renders nothing when there are no
   genuine matches, so it never shows an empty module.
   ────────────────────────────────────────────── */

import { relatedServices, relatedPosts } from '../lib/related'

export default function RelatedContent({ article }) {
  const services = relatedServices(article)
  const posts = relatedPosts(article)
  if (services.length === 0 && posts.length === 0) return null

  return (
    <nav className="article-page__related" aria-label="Related content">
      {services.length > 0 && (
        <div className="related-group">
          <h2 className="related-group__title">Related services</h2>
          <ul className="related-list">
            {services.map(service => (
              <li key={service.slug}>
                <a className="related-link" href={`/services/${service.slug}`}>{service.name}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {posts.length > 0 && (
        <div className="related-group">
          <h2 className="related-group__title">Keep reading</h2>
          <ul className="related-list">
            {posts.map(post => (
              <li key={post.slug}>
                <a className="related-link" href={`/content/${post.slug}`}>{post.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
