import Link from 'next/link'
import SectionWrapper from './ui/SectionWrapper'
import { caseStudies } from '../data/caseStudies'
import './CaseStudies.css'

function CaseStudies() {
  return (
    <SectionWrapper id="case-studies">
      <div className="cases__header" data-animate="fade-up">
        <span className="cases__label">// results</span>
        <h2 className="cases__title">Real Results From Real Clients</h2>
        <p className="cases__desc">
          No fluff. No vanity metrics. Here&apos;s what happens when cold email is done right.
        </p>
      </div>

      <div className="cases__grid" data-animate="stagger">
        {caseStudies.map(study => (
          <Link
            key={study.id}
            href={`/case-studies/${study.slug}`}
            className="cases__card"
          >
            <span className="cases__badge">{study.badge}</span>
            <span className="cases__company">{study.company}</span>
            <span className="cases__vertical">{study.vertical}</span>
            <p className="cases__headline">{study.headline}</p>

            <div className="cases__metrics">
              <div className="cases__metric">
                <span className="cases__metric-value">{study.metrics.leads}</span>
                <span className="cases__metric-label">Leads</span>
              </div>
              <div className="cases__metric">
                <span className="cases__metric-value">{study.metrics.revenue}</span>
                <span className="cases__metric-label">Revenue</span>
              </div>
            </div>

            <blockquote className="cases__quote">{study.quote}</blockquote>
            <span className="cases__quote-name">&mdash; {study.quoteName}</span>

            <span className="cases__read-more">Read full case study &rarr;</span>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default CaseStudies
