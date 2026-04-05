import SectionWrapper from './ui/SectionWrapper'
import GlowButton from './ui/GlowButton'
import { pricingPackages } from '../data/pricing'
import './Pricing.css'

function Pricing() {
  return (
    <SectionWrapper id="pricing">
      <div className="pricing__header">
        <span className="pricing__label">// pricing</span>
        <h2 className="pricing__title">CHOOSE YOUR GTM PLAN</h2>
        <p className="pricing__desc">
          Two ways to work with us. Both engineered for pipeline, not busywork.
        </p>
        <pre className="pricing__ascii">{`
    ┌─────────────────────────────┐
    │  $ cat pricing.txt          │
    │  > No surprises. No fluff.  │
    └─────────────────────────────┘
        `}</pre>
      </div>

      <div className="pricing__grid">
        {pricingPackages.map(pkg => (
          <div key={pkg.id} className={`pricing__card pricing__card--${pkg.tier}`}>
            {pkg.tier === 'recommended' && (
              <span className="pricing__badge">RECOMMENDED</span>
            )}
            <span className="pricing__icon">{pkg.icon}</span>
            <h3 className="pricing__card-name">{pkg.name}</h3>
            <p className="pricing__card-subtitle">{pkg.subtitle}</p>

            <div className="pricing__price">
              <span className="pricing__price-value">{pkg.price}</span>
              {pkg.pricePeriod && (
                <span className="pricing__price-period">{pkg.pricePeriod}</span>
              )}
            </div>
            {pkg.priceNote && (
              <span className="pricing__price-note">{pkg.priceNote}</span>
            )}

            <ul className="pricing__features">
              {pkg.features.map(feature => (
                <li key={feature} className="pricing__feature">
                  <span className="pricing__check">&#10003;</span> {feature}
                </li>
              ))}
            </ul>

            <GlowButton href={pkg.cta.href} variant={pkg.cta.variant} size="md">
              {pkg.cta.label}
            </GlowButton>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default Pricing
