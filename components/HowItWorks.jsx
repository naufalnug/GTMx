import SectionWrapper from './ui/SectionWrapper'
import './HowItWorks.css'

const steps = [
  {
    number: '01',
    title: 'Audit',
    timeframe: 'Week 1',
    description: 'We audit your current stack, ICP, data, and workflows. You get a clear picture of what\'s working, what\'s leaking, and where the biggest pipeline wins are.',
  },
  {
    number: '02',
    title: 'Build',
    timeframe: 'Weeks 2–6',
    description: 'We design and implement your revenue infrastructure — domains, enrichment, sequences, routing, and dashboards. Fully operational, not a slide deck.',
  },
  {
    number: '03',
    title: 'Optimize',
    timeframe: 'Ongoing',
    description: 'We tune the system for conversion and pipeline velocity. A/B test copy, rotate domains, refine targeting, and scale what works.',
  },
]

function HowItWorks() {
  return (
    <SectionWrapper id="how-it-works">
      <div className="how__header">
        <span className="how__label">// how_it_works</span>
        <h2 className="how__title">FROM ZERO TO PIPELINE IN 3 STEPS</h2>
        <p className="how__desc">
          No 6-month onboarding. No bloated SOWs. We move fast because we've done this before.
        </p>
      </div>

      <div className="how__steps">
        {steps.map((step, i) => (
          <div key={step.number} className="how__step">
            <div className="how__step-header">
              <span className="how__step-number">{step.number}</span>
              <div className="how__step-line" />
            </div>
            <h3 className="how__step-title">{step.title}</h3>
            <span className="how__step-timeframe">{step.timeframe}</span>
            <p className="how__step-desc">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default HowItWorks
