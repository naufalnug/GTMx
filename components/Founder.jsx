import './Founder.css'

function Founder() {
  return (
    <section className="section">
      <div className="wrap section-head">
        <span className="eyebrow">Why Us</span>
        <h2 className="h2">
          We&apos;ve been on <em>both sides</em> of this table.
        </h2>
      </div>
      <div className="wrap founder-content">
        <p className="lede" style={{ fontSize: 19 }}>
          Our founders have spent <strong style={{ color: 'var(--ink)' }}>8+ years as Account Executives</strong>{' '}
          selling B2B tech, have run their own agencies, and worked at top-5 global agencies.
          We&apos;ve also built GTM systems inside YC-backed companies. We&apos;ve been on
          the execution side &mdash; so we know exactly what the buyers
          you&apos;re trying to reach expect to see.
        </p>
        <div className="founder-stats">
          <div>
            <div className="v">8<em>+</em></div>
            <div className="l">Years B2B sales &amp; GTM engineering</div>
          </div>
          <div>
            <div className="v">YC</div>
            <div className="l">Portfolio GTM systems built</div>
          </div>
          <div>
            <div className="v">Ops</div>
            <div className="l">Native &mdash; we&apos;ve built outbound engines, not just advised</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Founder
