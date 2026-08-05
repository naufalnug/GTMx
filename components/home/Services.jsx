/* ──────────────────────────────────────────────
   GTMx — components/home/Services.jsx
   Three service cards. Color order is locked everywhere:
   orange = Automated Outbound, blue = RevOps, green = Search.
   "Learn more" links point at the real /services/[slug] routes.
   ────────────────────────────────────────────── */

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
)

export default function Services() {
  return (
    <section className="section" id="services">
      <div className="sec-head">
        <h2 className="h2">One engine. <span className="hl">Three systems.</span></h2>
        <p className="sec-lede">Most teams duct-tape tools and agencies together and call it a go-to-market. We build outbound, RevOps, and search as one connected system &mdash; and run it for you.</p>
      </div>

      <div className="cards">
        {/* Automated Outbound */}
        <article className="card card--flame">
          <span className="card__num">01</span>
          <div className="card__tile">
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none" stroke="#1A1712" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="11" width="30" height="22" rx="4" /><path d="M7 14 l15 11 15-11" /></svg>
          </div>
          <h3 className="card__title">Automated Outbound</h3>
          <p className="card__blurb">Cold email + LinkedIn campaigns that book meetings &mdash; built, launched, and run end to end.</p>
          <ul className="card__list">
            <li>Email infrastructure &amp; deliverability</li>
            <li>ICP targeting &amp; enrichment in Clay</li>
            <li>Personalized multi-channel copy</li>
          </ul>
          <a href="/services/automated-outbound" className="card__more" aria-label="Learn more about Automated Outbound">Learn more <Arrow /></a>
        </article>

        {/* RevOps */}
        <article className="card card--peri">
          <span className="card__num">02</span>
          <div className="card__tile">
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none" stroke="#1A1712" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="22" r="5" /><circle cx="31" cy="12" r="5" /><circle cx="31" cy="32" r="5" /><path d="M17.5 19.5 26.5 14M17.5 24.5 26.5 30" /></svg>
          </div>
          <h3 className="card__title">RevOps</h3>
          <p className="card__blurb">GTM engineering as a service &mdash; TAM sourcing, enrichment, lead scoring, and a CRM that runs itself.</p>
          <ul className="card__list">
            <li>TAM sourcing &amp; segmentation</li>
            <li>Inbound enrich, score &amp; route</li>
            <li>Clay &times; HubSpot / Salesforce builds</li>
          </ul>
          <a href="/services/revops" className="card__more" aria-label="Learn more about RevOps">Learn more <Arrow /></a>
        </article>

        {/* Search */}
        <article className="card card--sage">
          <span className="card__num">03</span>
          <div className="card__tile">
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none" stroke="#1A1712" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="11" /><path d="M28 28 35 35" /><path d="M20 13 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6 z" fill="#E8552B" strokeWidth="1.2" /></svg>
          </div>
          <h3 className="card__title">Search</h3>
          <p className="card__blurb">Rank on Google and get cited by AI answer engines &mdash; ChatGPT, Claude, Perplexity, and Gemini.</p>
          <ul className="card__list">
            <li>Technical SEO &amp; content at scale</li>
            <li>Answer-engine optimization</li>
            <li>Authority, citations &amp; tracking</li>
          </ul>
          <a href="/services/seo-aeo" className="card__more" aria-label="Learn more about Search">Learn more <Arrow /></a>
        </article>
      </div>
    </section>
  )
}
