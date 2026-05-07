import './Problem.css'

const MISTAKES = [
  {
    n: '01',
    title: 'Relying on What Got You Here',
    body: 'The inbound-led, referral-driven, founder-sales motion that got your first customers doesn\u2019t scale. Structured outbound requires ROI-first messaging, engineered sequences, and infrastructure. Running the old playbook at new targets produces silence.',
  },
  {
    n: '02',
    title: 'Hiring a VP of Sales Too Early',
    body: 'A VP of Sales costs $250K+ fully loaded and takes 6 months to ramp. Most B2B companies\u2019 first senior sales hire fails \u2014 not because of the person, but because there\u2019s no repeatable process for them to execute. You need the engine before you hire the driver.',
  },
  {
    n: '03',
    title: 'Messaging Built for the Wrong Buyer',
    body: 'Your pitch was crafted for the people you already know. New buyer segments have different pain points, different urgency triggers, and different social proof requirements. Generic messaging gets ignored \u2014 outbound messaging needs to be engineered for each ICP.',
  },
]

function Problem() {
  return (
    <section id="problem" className="section">
      <div className="wrap section-head">
        <span className="eyebrow">The Problem</span>
        <h2 className="h2">
          The <em>three mistakes</em> that kill outbound before it starts.
        </h2>
      </div>
      <div className="wrap">
        <div className="problem-grid">
          {MISTAKES.map((item) => (
            <div key={item.n} className="problem-card reveal">
              <span className="problem-num">&mdash; {item.n}</span>
              <h3 className="h3">{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Problem
