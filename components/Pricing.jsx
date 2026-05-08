/* ──────────────────────────────────────────────
   GTMx — components/Pricing.jsx
   Drop-in replacement: kills "starts $X*" framing,
   quotes the price cleanly, two tiers + footnote.
   ────────────────────────────────────────────── */

import './Pricing.css'

const tiers = [
  {
    name: 'LAUNCHPAD',
    num: '$10,000',
    italic: '',
    per: 'one-time · 30-day build',
    bestFor: 'You want the engine running but plan to operate it in-house after launch.',
    includes: [
      'Domain + DNS infrastructure',
      'Inbox warmup & deliverability monitoring',
      'List building + Clay enrichment',
      'Multi-angle sequence development',
      'A/B testing + reply triage',
      'Full handoff documentation',
    ],
    cta: 'Book a scoping call',
    accent: false,
  },
  {
    name: 'OPERATOR',
    num: '$6,000',
    italic: '',
    per: '/ month · ongoing operations',
    bestFor: 'You want us running the engine. No internal hire, no internal headache.',
    includes: [
      'Everything in Launchpad',
      'Weekly performance review + iteration',
      'Continuous list refresh + intent signals',
      'Reply handling + lead qualification',
      'Slack channel + monthly strategy session',
      'Cancel anytime, 30-day notice',
    ],
    cta: 'Book a scoping call',
    accent: true,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="section pricing dark">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow eyebrow--code">// pricing</span>
          <div>
            <h2 className="h2">Two ways in.<br/><em>Pick your operator footprint.</em></h2>
            <p className="lede">
              No retainers-by-the-hour. No discovery-phase upcharges. Build it once or
              run it ongoing. Quoted, scoped, shipped.
            </p>
          </div>
        </div>

        <div className="pricing__grid">
          {tiers.map(t => (
            <div key={t.name} className={`pricing__tier ${t.accent ? 'pricing__tier--accent' : ''}`}>
              <span className="price__name">{t.name}</span>

              <div className="price__amount">
                <span className="price__num">{t.num}</span>
                <span className="price__per">{t.per}</span>
              </div>

              <p className="pricing__bestfor">
                <span className="pricing__bestfor-label">Best for —</span>
                {t.bestFor}
              </p>

              <ul className="pricing__includes">
                {t.includes.map(line => (
                  <li key={line}>{line}</li>
                ))}
              </ul>

              <a
                href="https://cal.com/gtmx/30min"
                className={`btn btn-lg ${t.accent ? 'btn-primary' : 'btn-ghost'}`}
                style={{ marginTop: 'auto' }}
              >
                {t.cta} <span className="arrow">→</span>
              </a>
            </div>
          ))}
        </div>

        <p className="pricing__fine">
          Custom scopes start at $20K. We'll quote the exact number on the audit call.
          No asterisks, no surprises.
        </p>
      </div>
    </section>
  )
}
