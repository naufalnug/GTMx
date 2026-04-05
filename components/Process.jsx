import SectionWrapper from './ui/SectionWrapper'
import './Process.css'

const STEPS = [
  {
    id: 'audit',
    number: '01',
    timeline: 'Week 1',
    title: 'GTM Audit',
    description:
      'We assess your current ICP definition, messaging, outbound setup, and CRM infrastructure against what US/EU buyers actually respond to. You get a clear picture of the gap \u2014 and exactly what we\u2019ll build to close it.',
  },
  {
    id: 'build',
    number: '02',
    timeline: 'Weeks 2\u20134',
    title: 'Build',
    description:
      'We engineer your outbound stack: domains, sequences, LinkedIn profiles, lead lists built on US expansion signals, and messaging rewritten for Western buyers.',
  },
  {
    id: 'launch',
    number: '03',
    timeline: 'Weeks 4\u20136',
    title: 'Launch',
    description:
      'Campaigns go live. Cold email and LinkedIn outbound running simultaneously. We manage replies, optimise sequences, and book meetings directly into your calendar.',
  },
  {
    id: 'scale',
    number: '04',
    timeline: 'Month 2+',
    title: 'Scale',
    description:
      'We report on pipeline, refine what\u2019s working, and build the GTM infrastructure that makes your sales team 10x more productive as you grow.',
  },
]

function Process() {
  return (
    <SectionWrapper id="process">
      <div className="process__header">
        <span className="process__label">// how_it_works</span>
        <h2 className="process__title">FROM ZERO TO US PIPELINE IN 60 DAYS</h2>
      </div>

      <div className="process__grid">
        {STEPS.map((step, i) => (
          <div key={step.id} className="process__step">
            <div className="process__step-header">
              <span className="process__number">{step.number}</span>
              {i < STEPS.length - 1 && <div className="process__line" />}
            </div>
            <span className="process__timeline">{step.timeline}</span>
            <h3 className="process__step-title">{step.title}</h3>
            <p className="process__step-desc">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default Process
