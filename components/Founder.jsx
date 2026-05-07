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
      <div className="wrap founder-grid">
        <div className="founder-pic">
          <div className="placeholder">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
            </svg>
            <span>Founder photo</span>
          </div>
          <div className="founder-meta">
            <div className="nm">Naufal Rabbani</div>
            <div className="role">Founder, GTMx</div>
          </div>
        </div>
        <div>
          <p className="lede" style={{ fontSize: 19 }}>
            Our founders have spent <strong style={{ color: 'var(--ink)' }}>8+ years as Account Executives</strong> selling B2B
            tech and building GTM systems inside YC-backed companies. We&apos;ve been on
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
      </div>
    </section>
  )
}

export default Founder
