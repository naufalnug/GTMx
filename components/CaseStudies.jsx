import SectionWrapper from './ui/SectionWrapper'
import Terminal from './ui/Terminal'
import { caseStudies } from '../data/caseStudies'
import './CaseStudies.css'

function CaseStudies() {
  return (
    <SectionWrapper id="case-studies">
      <div className="cases__header">
        <span className="cases__label">// case_studies</span>
        <h2 className="cases__title">RESULTS THAT COMPOUND</h2>
        <p className="cases__desc">
          Real pipelines. Real numbers. Here's what happens when GTM gets engineered.
        </p>
        <pre className="cases__ascii">{`     ╭──────╮
     │ ◉  ◉ │  "ship pipelines,
     │  ──  │   not slide decks"
     ╰──────╯`}</pre>
      </div>

      <div className="cases__grid">
        {caseStudies.map(study => (
          <div key={study.id} className="cases__card">
            <Terminal title={study.vertical}>
              <div className="cases__card-inner">
                <span className="cases__badge">{study.badge}</span>
                {study.location && (
                  <span className="cases__location">{study.location}</span>
                )}
                <p className="cases__problem">{study.problem}</p>

                <div className="cases__metrics">
                  <div className="cases__metric-col">
                    <span className="cases__metric-label">BEFORE</span>
                    <span className="cases__metric-value cases__metric-value--before">
                      {study.metrics.before}
                    </span>
                  </div>
                  <span className="cases__arrow">--&gt;</span>
                  <div className="cases__metric-col">
                    <span className="cases__metric-label">AFTER</span>
                    <span className="cases__metric-value cases__metric-value--after">
                      {study.metrics.after}
                    </span>
                  </div>
                </div>

                <div className="cases__meta">
                  <span>{study.metrics.channels}</span>
                  <span>{study.metrics.timeline}</span>
                </div>

                <blockquote className="cases__quote">{study.quote}</blockquote>
                <span className="cases__quote-name">{study.quoteName}</span>
              </div>
            </Terminal>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default CaseStudies
