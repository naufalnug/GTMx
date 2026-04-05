import SectionWrapper from './ui/SectionWrapper'
import GlowButton from './ui/GlowButton'
import { pricingPackages } from '../data/pricing'
import './Pricing.css'

function Pricing() {
  return (
    <SectionWrapper id="pricing">
      <div className="pricing__header" data-animate="fade-up">
        <span className="pricing__label">// pricing</span>
        <h2 className="pricing__title">Two Ways to Work With GTMx</h2>
      </div>

      <div className="pricing__grid" data-animate="stagger">
        {pricingPackages.map(pkg => (
          <div key={pkg.id} className={`pricing__card pricing__card--${pkg.tier}`}>
            <div className="pricing__badge-area">
              {pkg.tier === 'recommended' && (
                <span className="pricing__badge">RECOMMENDED</span>
              )}
            </div>
            <h3 className="pricing__card-name">{pkg.name}</h3>
            <p className="pricing__card-subtitle">{pkg.subtitle}</p>

            {pkg.bestFor && (
              <p className="pricing__best-for">Best for: {pkg.bestFor}</p>
            )}

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

      <p className="pricing__currency-note">
        Not sure which is right for you? Book a free 30-minute GTM Audit call. We&apos;ll tell you honestly where you are and what you actually need.
      </p>
    </SectionWrapper>
  )
}

export default Pricing
