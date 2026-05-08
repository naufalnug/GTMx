/* ──────────────────────────────────────────────
   GTMx — components/Hero.jsx
   Refined: tighter headline rhythm + 3 mono
   datapoints replacing the prose proof line.
   ────────────────────────────────────────────── */

import './Hero.css'

const proofPoints = [
  { num: '8+ yrs', label: 'B2B sales & GTM' },
  { num: 'YC',     label: 'portfolio operators' },
  { num: '$170K+', label: 'pipeline shipped' },
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
          done for you in 14 days. Not a slide deck. Not an agency. An engine.
        </p>

        <div className="hero__cta">
          <a href="https://cal.com/gtmx/30min" className="btn btn-primary btn-lg">
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
