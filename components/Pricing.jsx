import { pricingPackages } from '../data/pricing'
import './Pricing.css'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="arrow">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="wrap section-head">
        <span className="eyebrow">Pricing</span>
        <h2 className="h2">
          The power of <em>10 SDRs</em> for the cost of one.
        </h2>
      </div>
      <div className="wrap">
        <div className="price-banner">
          <div className="num x10">
            <em>10&times;</em> <small>SDR output</small>
          </div>
          <p className="copy">
            A US-based SDR runs <strong>$80&ndash;120K fully loaded</strong>, ramps for 6 months, and you get
            one person&apos;s output. GTMx delivers a fully engineered outbound engine + RevOps infrastructure
            for a fraction of that &mdash; running in weeks, not quarters.
          </p>
        </div>

        <div className="price-grid">
          {pricingPackages.map((pkg) => {
            const isFeatured = pkg.tier === 'recommended'
            return (
              <div key={pkg.id} className={`price-card reveal ${isFeatured ? 'featured' : ''}`}>
                {isFeatured && <span className="pill">Recommended</span>}
                <div className="price-card-tier">{pkg.name}</div>
                <div>
                  <div className="price-card-name">{pkg.subtitle.split(' · ')[0]}</div>
                  <div className="price-card-best muted">{pkg.bestFor}</div>
                </div>
                <div>
                  <div className="price-card-rate">
                    starts {pkg.price}
                    {pkg.pricePeriod && <em>{pkg.pricePeriod}</em>}
                    {!pkg.pricePeriod && <em>/ project</em>}
                  </div>
                  <div className="price-card-sub">{pkg.priceNote}</div>
                </div>
                <ul>
                  {pkg.features.map((f) => (
                    <li key={f}>
                      <span className="check"><CheckIcon /></span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="#book" className={`btn ${isFeatured ? 'btn-primary' : 'btn-ghost'}`} style={{ marginTop: 8 }}>
                  Book a Call <ArrowIcon />
                </a>
              </div>
            )
          })}
        </div>
        <p className="price-foot">
          Not sure which is right?{' '}
          <a href="#book" className="link-arrow">
            Book a free 30-min audit <ArrowIcon />
          </a>
          {' '}&mdash; we&apos;ll tell you honestly where you are and what you actually need.
        </p>
      </div>
    </section>
  )
}

export default Pricing
