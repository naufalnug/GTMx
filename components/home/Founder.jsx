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
          <span className="founder-photo__tag">Founder</span>
        </div>
        <div className="founder-copy">
          <h2 className="h2">I&apos;ve been on <span className="hl">both sides</span> of the table.</h2>
          <p>Hey there, I&apos;m Josh. I&apos;ve worn a lot of hats: project manager, product manager, blogger (back in the pre-ChatGPT days), cold email agency owner, GTM engineer, and then a cold email agency owner again. That loop wasn&apos;t an accident. Every detour taught me something about how B2B pipeline actually gets built, and it kept pulling me back to the thing I&apos;m best at &mdash; which is GTM.</p>
          <p>To date, I&apos;ve sent <strong>multiple millions of emails</strong> and generated <strong>over 5,000 MQLs</strong> for bootstrapped and VC-backed companies. Let&apos;s have a chat to see if GTMx can help you grow your MRR today.</p>
          <a
            className="founder-linkedin"
            href="https://www.linkedin.com/in/youhavefoundjoshua/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
            </svg>
            Connect with Josh on LinkedIn
          </a>
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
