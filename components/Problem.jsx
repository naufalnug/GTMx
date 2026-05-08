import './Problem.css'

const MISTAKES = [
  {
    n: '01',
    title: 'No Repeatable Process, So Nothing Scales',
    body: 'Founders close their first deals through networks, warm intros, and hustle. But when they point that at cold markets, it dies. There\u2019s no ICP definition sharp enough, no sequences built for strangers, no infrastructure to run it consistently. They try outbound once, it doesn\u2019t work, and they conclude "outbound doesn\u2019t work for us" \u2014 when the real issue is they never built the engine.',
  },
  {
    n: '02',
    title: 'Wasted Spend on the Wrong Hire at the Wrong Time',
    body: 'The instinct is to hire a VP of Sales or an SDR to "do outbound." But without a repeatable process underneath them, that hire fails \u2014 fast. Founders blame the person, not the missing system. $250K+ burned, 6 months lost, and still no pipeline. You need the engine before you hire the driver.',
  },
  {
    n: '03',
    title: 'Messaging That Converts Warm Leads but Loses Cold Ones',
    body: 'Founders write copy based on what resonated with people who already knew them. Cold buyers have zero context, different urgency triggers, and higher skepticism. Open rates look okay but replies are dead, because the message is solving the wrong problem for the wrong person. Unengineered messaging is the #1 deliverability killer founders don\u2019t see until it\u2019s too late.',
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
