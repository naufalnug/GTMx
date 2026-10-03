import { notFound } from 'next/navigation'
import Navbar from '../../../components/home/Navbar'
import Footer from '../../../components/home/Footer'
import CaseStudyCta from '../../../components/CaseStudyCta'
import { caseStudies } from '../../../data/caseStudies'
import { pageMetadata, absoluteUrl, SITE_URL, SITE_NAME } from '../../../lib/seo'
import JsonLd from '../../../components/JsonLd'
import { baseNodes, graph, webPageNode, breadcrumbNode, ORG_ID } from '../../../lib/schema'
import '../../home.css'
import './page.css'

// `</script>`-safe JSON-LD serialization (matches the article route).

export function generateStaticParams() {
  return caseStudies.map(study => ({
    slug: study.slug,
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const study = caseStudies.find(s => s.slug === slug)
  // No canonical for an unknown slug \u2014 the page itself 404s (notFound below).
  if (!study) return {}

  return pageMetadata({
    path: `/case-studies/${study.slug}`,
    title: `${study.company} Case Study | GTMx`,
    description: study.metaDescription || study.headline,
    openGraph: {
      // No `title` override: og:title and twitter:title inherit `title`, so all
      // three stay identical and use one separator convention (decision D1).
      description: study.metaDescription || study.headline,
      type: 'article',
    },
  })
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params
  const study = caseStudies.find(s => s.slug === slug)
  if (!study) notFound()

  const url = absoluteUrl(`/case-studies/${study.slug}`)
  // Article uses only data already on the page — no publish date exists in the
  // source, so datePublished is intentionally omitted rather than invented.
  const jsonLdGraph = graph([
    ...baseNodes,
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: `${study.company} Case Study`,
      description: study.metaDescription || study.headline,
      // Client named as plain text only. No sameAs, no Organization node for the
      // client, no Review and no Rating.
      about: study.company,
      url,
      image: `${url}/opengraph-image`,
      mainEntityOfPage: { '@id': `${url}#webpage` },
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
    },
    webPageNode({ url, name: `${study.company} Case Study`, description: study.metaDescription || study.headline }),
    breadcrumbNode(url, [
      ['Home', SITE_URL],
      ['Case studies', `${SITE_URL}/case-studies`],
      [`${study.company} Case Study`, url],
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLdGraph} />
      <Navbar />
      <div className="dd">
        <main className="casestudy">
          <article className="casestudy__inner">
          <div className="casestudy__header">
            <a href="/#case-studies" className="casestudy__back">&larr; Back to Case Studies</a>
            <span className="casestudy__badge">{study.badge}</span>
            <h1 className="casestudy__title">
              {study.h1Result
                ? `${study.company} Case Study: ${study.h1Result}`
                : `${study.company} Case Study`}
            </h1>
            <p className="casestudy__vertical">{study.vertical}</p>
            <p className="casestudy__headline">{study.headline}</p>
          </div>

          {/* Key metrics */}
          <div className="casestudy__metrics-grid">
            <div className="casestudy__metric-card">
              <span className="casestudy__metric-value">{study.metrics.leads}</span>
              <span className="casestudy__metric-label">Leads Generated</span>
            </div>
            <div className="casestudy__metric-card">
              <span className="casestudy__metric-value">{study.metrics.revenue}</span>
              <span className="casestudy__metric-label">Revenue Closed</span>
            </div>
            <div className="casestudy__metric-card">
              <span className="casestudy__metric-value">{study.metrics.pipeline}</span>
              <span className="casestudy__metric-label">Pipeline Value</span>
            </div>
            <div className="casestudy__metric-card">
              <span className="casestudy__metric-value">{study.metrics.timeline}</span>
              <span className="casestudy__metric-label">Timeline</span>
            </div>
          </div>

          {/* The challenge */}
          <section className="casestudy__section">
            <h2 className="casestudy__h2">{study.challengeH2}</h2>
            <p className="casestudy__paragraph">{study.problem}</p>
            <p className="casestudy__paragraph">{study.testimonial.context}</p>
          </section>

          {/* Campaign stats if available */}
          {study.campaignStats && (
            <section className="casestudy__section">
              <h2 className="casestudy__h2">Campaign Performance</h2>
              <div className="casestudy__table-wrap">
                <table className="casestudy__table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Sent</th>
                      <th>Replies</th>
                      <th>Reply Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {study.campaignStats.map((row, i) => (
                      <tr key={i}>
                        <td>{row.name}</td>
                        <td>{row.sent}</td>
                        <td>{row.replies}</td>
                        <td className="casestudy__highlight">{row.replyRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Overall stats if available */}
          {study.overallStats && (
            <section className="casestudy__section">
              <h2 className="casestudy__h2">Overall Campaign Stats</h2>
              <div className="casestudy__stats-grid">
                {Object.entries(study.overallStats).map(([key, value]) => (
                  <div key={key} className="casestudy__stat">
                    <span className="casestudy__stat-value">{value}</span>
                    <span className="casestudy__stat-label">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Results */}
          <section className="casestudy__section">
            <h2 className="casestudy__h2">Key Results</h2>
            <ul className="casestudy__list">
              {study.testimonial.highlights.map((item, i) => (
                <li key={i} className="casestudy__list-item">{item}</li>
              ))}
            </ul>
          </section>

          {/* Testimonial quote */}
          <section className="casestudy__section">
            <blockquote className="casestudy__blockquote">
              {study.quote}
              <cite className="casestudy__cite">&mdash; {study.quoteName}</cite>
            </blockquote>
          </section>

          {/* CTA */}
          <CaseStudyCta />
          </article>
        </main>
        <Footer />
      </div>
    </>
  )
}
