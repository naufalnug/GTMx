import SectionWrapper from './ui/SectionWrapper'
import './SocialProof.css'

const PROOF_STATS = [
  {
    number: '8+',
    label: 'Years Combined APAC & European B2B Sales Experience',
  },
  {
    number: 'YC',
    label: 'GTM Systems Built for YC-Portfolio Companies in the US',
  },
  {
    number: 'APAC',
    label: 'Native \u2014 We Understand Why Your Current Motion Doesn\u2019t Translate West',
  },
]

function SocialProof() {
  return (
    <SectionWrapper id="proof">
      <div className="proof__header" data-animate="fade-up">
        <span className="proof__label">// proof</span>
        <h2 className="proof__title">We&apos;ve Been on Both Sides of This Table</h2>
        <p className="proof__desc">
          Our founders have spent 8+ years as Account Executives selling B2B tech
          across APAC and Europe. We&apos;ve also built GTM systems inside YC-backed
          companies expanding into the US &mdash; so we know exactly what the buyers
          you&apos;re trying to reach expect to see.
        </p>
      </div>

      <div className="proof__stats" data-animate="stagger">
        {PROOF_STATS.map((stat, i) => (
          <div key={i} className="proof__stat">
            <span className="proof__stat-number" data-animate="counter">{stat.number}</span>
            <span className="proof__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default SocialProof
