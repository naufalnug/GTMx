/* ──────────────────────────────────────────────
   GTMx — components/home/Results.jsx
   Real case-study metric cards.
   ────────────────────────────────────────────── */

import { clientFacts as F } from '../../lib/site-facts'

export default function Results() {
  return (
    <section className="section" id="work">
      <div className="sec-head">
        <h2 className="h2">B2B Outbound Case Studies: Engines We&apos;ve <span className="hl">Already Built</span></h2>
        <p className="sec-lede">Real campaigns, real numbers. Pipeline that turned into booked meetings and closed revenue &mdash; not vanity metrics.</p>
      </div>

      <div className="results-grid">
        <a className="rcard rcard--a" href="/case-studies/opensponsorship">
          <div className="rcard__top">
            <h3 className="rcard__co">OpenSponsorship</h3>
            <span className="rcard__vert">Athlete marketing &middot; backed by Serena Williams</span>
          </div>
          <div className="rcard__body">
            <span className="rcard__metric">{F.openSponsorship.leads}</span>
            <span className="rcard__mlabel">sales-qualified leads generated</span>
            <div className="rcard__subs">
              <div className="rcard__sub"><b>{F.openSponsorship.pipeline}</b><span>pipeline</span></div>
              <div className="rcard__sub"><b>{F.openSponsorship.revenue}</b><span>closed</span></div>
            </div>
            <p className="rcard__quote">&ldquo;The AI-personalized approach matched each brand&apos;s products with relevant athletes &mdash; pitches that actually resonated with CMOs.&rdquo;
              <span className="rcard__who">— OpenSponsorship team</span>
            </p>
          </div>
        </a>

        <a className="rcard rcard--b" href="/case-studies/strategy-achievers">
          <div className="rcard__top">
            <h3 className="rcard__co">Strategy Achievers</h3>
            <span className="rcard__vert">Personal branding agency</span>
          </div>
          <div className="rcard__body">
            <span className="rcard__metric">{F.strategyAchievers.revenue}</span>
            <span className="rcard__mlabel">closed in the first few weeks</span>
            <div className="rcard__subs">
              <div className="rcard__sub"><b>{F.strategyAchievers.pipeline}</b><span>pipeline</span></div>
              <div className="rcard__sub"><b>{F.strategyAchievers.leads}</b><span>leads</span></div>
              <div className="rcard__sub"><b>24 hrs</b><span>to first replies</span></div>
            </div>
            <p className="rcard__quote">&ldquo;Within 24 hours we had around 6 leads. Within about 45 hours, that grew to 10 people ready to jump on calls.&rdquo;
              <span className="rcard__who">— Pascal, CEO</span>
            </p>
          </div>
        </a>

        <a className="rcard rcard--c" href="/case-studies/metatron-concepts">
          <div className="rcard__top">
            <h3 className="rcard__co">Vidify</h3>
            <span className="rcard__vert">AI video generation &middot; B2B</span>
          </div>
          <div className="rcard__body">
            <span className="rcard__metric">{F.vidify.opportunities}</span>
            <span className="rcard__mlabel">opportunities generated</span>
            <div className="rcard__subs">
              <div className="rcard__sub"><b>{F.vidify.pipeline}</b><span>pipeline</span></div>
              <div className="rcard__sub"><b>{F.vidify.bestMonth}</b><span>in one month</span></div>
              <div className="rcard__sub"><b>3</b><span>agencies before us</span></div>
            </div>
            <p className="rcard__quote">&ldquo;You weren&apos;t just executing &mdash; you were teaching us while delivering results. Last month alone, ~54 opportunities.&rdquo;
              <span className="rcard__who">— Ahmed, Director of PM</span>
            </p>
          </div>
        </a>
      </div>
      <p className="results-all">
        <a href="/case-studies">See all four case studies</a>
      </p>
    </section>
  )
}
