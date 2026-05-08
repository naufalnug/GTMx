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
          Two co-founders with <strong style={{ color: 'var(--ink)' }}>10+ years in GTM</strong>{' '}
          as Account Executives, Product Marketers, and agency operators.
          We&apos;ve each run our own agencies, worked inside top-5 global agencies,
          and built GTM systems for YC-backed and publicly traded companies.
          We&apos;ve been on the execution side, so we know exactly what
          the buyers you&apos;re trying to reach expect to see.
        </p>
        <div className="founder-stats">
          <div>
            <div className="v">10<em>+</em></div>
            <div className="l">Years in GTM</div>
          </div>
          <div>
            <div className="v">YC</div>
            <div className="l">&amp; publicly traded company operators</div>
          </div>
          <div>
            <div className="v">2x</div>
            <div className="l">Co-founders, each ran their own agency</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Founder
