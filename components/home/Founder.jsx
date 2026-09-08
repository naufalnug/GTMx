/* ──────────────────────────────────────────────
   GTMx — components/home/Founder.jsx
   The human counterweight to the systems.
   ────────────────────────────────────────────── */

export default function Founder() {
  return (
    <section className="section" id="about">
      <div className="founder-grid">
        <div className="founder-photo">
          <img
            src="/founder-headshot.jpg"
            alt="Josh, founder of GTMx"
            width={1000}
            height={1000}
            className="founder-photo__img"
            loading="lazy"
            decoding="async"
          />
          <span className="founder-photo__tag">Josh</span>
        </div>
        <div className="founder-copy">
          <h2 className="h2">I&apos;ve been on <span className="hl">both sides</span> of the table.</h2>
          <p>Hey there, I&apos;m Josh. I&apos;ve worn a lot of hats: project manager, product manager, blogger (back in the pre-ChatGPT days), cold email agency owner, GTM engineer, and then a cold email agency owner again. That loop wasn&apos;t an accident. Every detour taught me something about how B2B pipeline actually gets built, and it kept pulling me back to the thing I&apos;m best at &mdash; which is GTM.</p>
          <p>To date, I&apos;ve sent <strong>multiple millions of emails</strong> and generated <strong>over 5,000 MQLs</strong> for bootstrapped and VC-backed companies. Let&apos;s have a chat to see if GTMx can help you grow your MRR today.</p>
          <div className="founder-stats">
            <div className="founder-stat"><div className="v">10<em>+</em></div><div className="l">years in GTM</div></div>
            <div className="founder-stat"><div className="v">YC</div><div className="l">&amp; public-co operators</div></div>
            <div className="founder-stat"><div className="v">5000<em>+</em></div><div className="l">MQLs generated</div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
