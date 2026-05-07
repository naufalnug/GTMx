import SectionWrapper from './ui/SectionWrapper'
import './IcpSection.css'

const GOOD_FIT = [
  'You\u2019re a B2B tech or SaaS company with a product people pay for',
  'Your product has proven traction with paying customers',
  'You\u2019re Series A\u2013B funded, or well-capitalised and ready to invest in GTM',
  'You\u2019re planning to hire a sales team \u2014 or already have and need the process',
  'You\u2019ve tried outbound before and it didn\u2019t work the way you expected',
]

const NOT_FIT = [
  'You\u2019re pre-product or pre-revenue',
  'You\u2019re looking for a cheap lead gen vendor to blast generic emails',
  'You\u2019re not serious about investing in a structured outbound engine',
]

function IcpSection() {
  return (
    <SectionWrapper id="icp">
      <div className="icp__header" data-animate="fade-up">
        <span className="icp__label">// who_this_is_for</span>
        <h2 className="icp__title">Built for One Type of Company</h2>
        <p className="icp__desc">
          GTMx works with B2B tech companies that have product-market fit and are ready
          to build a repeatable outbound revenue engine.
        </p>
      </div>

      <div className="icp__grid" data-animate="stagger">
        <div className="icp__card icp__card--fit">
          <h3 className="icp__card-title">You&apos;re the right fit if:</h3>
          <ul className="icp__list">
            {GOOD_FIT.map(item => (
              <li key={item} className="icp__item icp__item--yes">
                <span className="icp__check">&#10003;</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="icp__card icp__card--nofit">
          <h3 className="icp__card-title">GTMx is not for you if:</h3>
          <ul className="icp__list">
            {NOT_FIT.map(item => (
              <li key={item} className="icp__item icp__item--no">
                <span className="icp__cross">&#10007;</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  )
}

export default IcpSection
