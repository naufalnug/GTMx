import './Process.css'

const STEPS = [
  {
    n: '01',
    when: 'Week 1',
    title: 'GTM Audit',
    body: 'We assess your current ICP definition, messaging, outbound setup, and CRM infrastructure against what your target buyers actually respond to. You get a clear picture of the gap \u2014 and exactly what we\u2019ll build to close it.',
  },
  {
    n: '02',
    when: 'Weeks 2\u20134',
    title: 'Build',
    body: 'We engineer your outbound stack: domains, sequences, LinkedIn profiles, lead lists built on high-intent signals, and messaging engineered for your target buyer.',
  },
  {
    n: '03',
    when: 'Weeks 4\u20136',
    title: 'Launch',
    body: 'Campaigns go live. Cold email and LinkedIn outbound running simultaneously. We manage replies, optimise sequences, and book meetings directly into your calendar.',
  },
  {
    n: '04',
    when: 'Month 2+',
    title: 'Scale',
    body: 'We report on pipeline, refine what\u2019s working, and build the GTM infrastructure that makes your sales team 10x more productive as you grow.',
  },
]

function Process() {
  return (
    <section id="process" className="section dark">
      <div className="wrap section-head">
        <span className="eyebrow">The Process</span>
        <h2 className="h2">
          From zero to pipeline in <em>60 days.</em>
        </h2>
      </div>
      <div className="wrap">
        <div className="process-list">
          {STEPS.map((s) => (
            <div key={s.n} className="process-step reveal">
              <span className="num">&mdash; {s.n}</span>
              <span className="when">{s.when}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Process
