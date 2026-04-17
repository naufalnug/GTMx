import { notFound } from 'next/navigation'
import ContentNavbar from '../../../components/ContentNavbar'
import CaseStudyCta from '../../../components/CaseStudyCta'
import { caseStudies } from '../../../data/caseStudies'
import './page.css'

export function generateStaticParams() {
  return caseStudies.map(study => ({
    slug: study.slug,
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const study = caseStudies.find(s => s.slug === slug)
  if (!study) return {}

  return {
    title: `${study.company} Case Study | GTMx`,
    description: study.headline,
    openGraph: {
      title: `${study.company} \u2014 ${study.headline}`,
      description: study.headline,
      type: 'article',
    },
  }
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params
  const study = caseStudies.find(s => s.slug === slug)
  if (!study) notFound()

  return (
    <>
      <ContentNavbar />
      <main className="casestudy">
        <article className="casestudy__inner">
          <div className="casestudy__header">
            <a href="/#case-studies" className="casestudy__back">&larr; Back to Case Studies</a>
            <span className="casestudy__badge">{study.badge}</span>
            <h1 className="casestudy__title">{study.company}</h1>
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
            <h2 className="casestudy__h2">The Challenge</h2>
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
    </>
  )
}
