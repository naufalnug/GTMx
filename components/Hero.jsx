/* ──────────────────────────────────────────────
   GTMx — components/Hero.jsx
   ────────────────────────────────────────────── */

import './Hero.css'

const proofPoints = [
  { num: '10+ yrs', label: 'in GTM' },
  { num: '5M+',     label: 'emails sent' },
  { num: '$4M+',    label: 'pipeline attributed' },
]

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero__wrap">
        <div className="hero__head">
          <span className="eyebrow">// outbound_growth_engine</span>
          <span className="hero__version">v.2026.05</span>
        </div>

        <h1 className="hero__title display">
          Your product works.<br/>
          Now build the <em>revenue engine.</em>
        </h1>

        <p className="hero__lede lede">
          Cold email + LinkedIn + GTM systems for B2B tech companies —
          done for you in 30 days. Not a slide deck. Not an agency. An engine.
        </p>

        <div className="hero__cta">
          <a href="#book" className="btn btn-primary btn-lg">
            Book a free GTM audit <span className="arrow">→</span>
          </a>
          <a href="#case-studies" className="link-arrow">
            See the work →
          </a>
        </div>

        <div className="hero__proof">
          {proofPoints.map(p => (
            <div key={p.num} className="hero__proof-item">
              <span className="hero__proof-num">{p.num}</span>
              <span className="hero__proof-label">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
