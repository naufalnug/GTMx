/* ──────────────────────────────────────────────
   GTMx — components/Hero.jsx
   ────────────────────────────────────────────── */

import './Hero.css'

const proofPoints = [
  { num: '10+ yrs', label: 'in GTM' },
  { num: '5M+',     label: 'emails sent' },
  { num: '$4M+',    label: 'pipeline attributed' },
  { num: '100%',    label: 'referral close rate' },
]

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero__wrap">
        <div className="hero__head">
          <div className="hero__head-left">
            <span className="eyebrow eyebrow--code">// outbound_growth_engine</span>
            <span className="hero__version">v.2026.05</span>
          </div>

          <div className="hero__widget">
            <div className="hero__widget-bar">
              <span className="hero__widget-dot" /> pipeline_run / live
            </div>
            <div className="hero__widget-row">
              <span>SQLs</span>
              <span className="hero__widget-num">40+</span>
            </div>
            <div className="hero__widget-row">
              <span>pipeline</span>
              <span className="hero__widget-num">$170K</span>
            </div>
            <div className="hero__widget-row">
              <span>closed</span>
              <span className="hero__widget-num">$10K</span>
            </div>
            <div className="hero__widget-foot">&mdash; OpenSponsorship &middot; live engagement</div>
          </div>
        </div>

        <h1 className="hero__title display">
          Your product works.<br/>
          Now build the <em>revenue engine.</em>
        </h1>

        <p className="hero__lede lede">
          Cold email + LinkedIn + GTM systems for B2B tech companies &mdash; shipped in
          30&ndash;60 days. Not a slide deck. Not an agency. An engine.
        </p>

        <div className="hero__cta">
          <a href="#book" className="btn btn-primary btn-lg">
            Book a free GTM audit <span className="arrow">&rarr;</span>
          </a>
          <a href="#case-studies" className="btn btn-ghost btn-lg">
            See the work <span className="arrow">&rarr;</span>
          </a>
        </div>

        <div className="hero__proof-wrap">
          <span className="hero__proof-section-label">// proof_points</span>
          <div className="hero__proof">
            {proofPoints.map(p => (
              <div key={p.num} className="hero__proof-item">
                <span className="hero__proof-num">{p.num}</span>
                <span className="hero__proof-label">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
