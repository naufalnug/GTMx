import Link from 'next/link'
import { caseStudies } from '../data/caseStudies'
import './CaseStudies.css'

function CaseStudies() {
  return (
    <section id="case-studies" className="section" style={{ background: 'var(--bg-sunk)' }}>
      <div className="wrap section-head">
        <span className="eyebrow">Results</span>
        <h2 className="h2">
          Real numbers. <em>Real clients.</em> No vanity metrics.
        </h2>
      </div>
      <div className="wrap">
        <div className="results-grid">
          {caseStudies.map((cs) => (
            <Link href={`/case-studies/${cs.slug}`} key={cs.slug} className="result-card reveal">
              <div>
                <div className="result-tag">{cs.badge}</div>
                <div className="result-name">{cs.company}</div>
                <div className="result-cat">{cs.vertical}</div>
              </div>
              <p className="result-headline">&ldquo;{cs.headline}&rdquo;</p>
              <div className="result-metrics">
                <div className="m">
                  <div className="v">{cs.metrics.leads}</div>
                  <div className="l">Leads</div>
                </div>
                <div className="m">
                  <div className="v">{cs.metrics.revenue}</div>
                  <div className="l">Revenue</div>
                </div>
              </div>
              <blockquote className="result-quote">
                {cs.quote.replace(/[\u201C\u201D]/g, '')}
                <span className="who">&mdash; {cs.quoteName}</span>
              </blockquote>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CaseStudies
