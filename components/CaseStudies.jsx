import SectionWrapper from './ui/SectionWrapper'
import { caseStudies } from '../data/caseStudies'
import './CaseStudies.css'

function CaseStudies() {
  return (
    <SectionWrapper id="case-studies">
      <div className="cases__header" data-animate="fade-up">
        <span className="cases__label">// results</span>
        <h2 className="cases__title">APAC Companies We&apos;ve Taken West</h2>
        <p className="cases__desc">
          Real expansions. Real numbers. Here&apos;s what happens when your US GTM gets engineered.
        </p>
      </div>

      <div className="cases__grid" data-animate="stagger">
        {caseStudies.map(study => (
          <div key={study.id} className="cases__card">
            <span className="cases__badge">{study.badge}</span>
            <span className="cases__location">{study.location}</span>
            <p className="cases__problem">{study.problem}</p>

            <div className="cases__result">
              <span className="cases__result-before">{study.metrics.before}</span>
              <span className="cases__result-arrow">&rarr;</span>
              <span className="cases__result-after">{study.metrics.after}</span>
            </div>

            <div className="cases__meta">
              <span>{study.metrics.channels}</span>
              <span>&middot;</span>
              <span>{study.metrics.timeline}</span>
            </div>

            <blockquote className="cases__quote">{study.quote}</blockquote>
            <span className="cases__quote-name">{study.quoteName}</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default CaseStudies
