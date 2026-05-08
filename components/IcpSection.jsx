/* ──────────────────────────────────────────────
   GTMx — components/IcpSection.jsx
   Drop-in replacement: kills ✓/✗ icons, replaces
   with mono fit_yes / not_fit tags.
   ────────────────────────────────────────────── */

import './IcpSection.css'

const fits = [
  'You have a working product with paying customers.',
  "You're a B2B SaaS / tech startup at $1M–$10M ARR.",
  "You're tired of agency theatre and want operators, not slide-deck consultants.",
  'Your team can sell — you just need pipeline to sell into.',
]

const notFits = [
  "You're pre-product or pre-revenue.",
  'You want a "growth hacker" cheap-list vendor.',
  "You're not ready to commit to 90 days of consistent execution.",
]

export default function IcpSection() {
  return (
    <section id="icp" className="section icp">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">// who_it_is_for</span>
          <div>
            <h2 className="h2">Built for teams that already <em>ship.</em></h2>
            <p className="lede">
              We don't fix product. We don't validate markets. We engineer the outbound
              engine that turns a working product into qualified pipeline.
            </p>
          </div>
        </div>

        <div className="icp__cols">
          <div className="icp__col">
            <h3 className="icp__col-head">A perfect fit <em>if —</em></h3>
            {fits.map(t => (
              <div key={t} className="icp__row">
                <span className="icp__tag icp__tag--yes">fit_yes</span>
                <span className="icp__text">{t}</span>
              </div>
            ))}
          </div>

          <div className="icp__col">
            <h3 className="icp__col-head icp__col-head--muted">Probably <em>not — if</em></h3>
            {notFits.map(t => (
              <div key={t} className="icp__row">
                <span className="icp__tag icp__tag--no">not_fit</span>
                <span className="icp__text">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
