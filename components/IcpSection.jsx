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
    <section id="icp" className="section">
      <div className="wrap section-head">
        <span className="eyebrow">Who It&apos;s For</span>
        <h2 className="h2">Built for <em>one</em> type of company.</h2>
      </div>
      <div className="wrap">
        <div className="icp-grid">
          <div className="icp-col reveal">
            <h3>You&apos;re the right fit if</h3>
            <ul>
              {GOOD_FIT.map((item) => (
                <li key={item}><span className="yes-mark">&#10003;</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="icp-col no reveal">
            <h3>GTMx is not for you if</h3>
            <ul>
              {NOT_FIT.map((item) => (
                <li key={item}><span className="no-mark">&#10007;</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default IcpSection
