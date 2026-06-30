/* ──────────────────────────────────────────────
   GTMx — components/home/Founder.jsx
   The human counterweight to the systems.
   ────────────────────────────────────────────── */

export default function Founder() {
  return (
    <section className="section" id="about">
      <div className="founder-grid">
        <div className="founder-photo">
          <span className="founder-arrow">more soon</span>
          <div className="founder-photo__stealth">
            {/* incognito glyph — hat + mask/glasses */}
            <svg width="116" height="116" viewBox="0 0 120 120" fill="none" stroke="#1A1712" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M24 58c6-22 16-32 36-32s30 10 36 32" />
              <path d="M16 58h88" />
              <circle cx="44" cy="76" r="13" />
              <circle cx="76" cy="76" r="13" />
              <path d="M57 76c1.5-2 4.5-2 6 0" />
            </svg>
            <span className="founder-photo__cap">Founders in stealth</span>
          </div>
          <span className="founder-photo__tag">Revealed soon</span>
        </div>
        <div className="founder-copy">
          <h2 className="h2">We&apos;ve been on <span className="hl">both sides</span> of the table.</h2>
          <p>Two co-founders with <strong>10+ years in GTM</strong> as Account Executives, product marketers, and agency operators. We&apos;ve each run our own agencies, worked inside top-5 global agencies, and built GTM systems for YC-backed and publicly traded companies. We&apos;ve been on the execution side &mdash; so we know exactly what the buyers you&apos;re trying to reach expect to see.</p>
          <div className="founder-stats">
            <div className="founder-stat"><div className="v">10<em>+</em></div>{' '}<div className="l">years in GTM</div></div>
            <div className="founder-stat"><div className="v">YC</div>{' '}<div className="l">&amp; public-co operators</div></div>
            <div className="founder-stat"><div className="v">2x</div>{' '}<div className="l">co-founders, each ran an agency</div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
