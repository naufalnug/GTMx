/* ──────────────────────────────────────────────
   GTMx — components/home/Results.jsx
   Real case-study metric cards.
   ────────────────────────────────────────────── */

export default function Results() {
  return (
    <section className="section" id="work">
      <div className="sec-head">
        <h2 className="h2">Engines we&apos;ve <span className="hl">already built.</span></h2>
        <p className="sec-lede">Real campaigns, real numbers. Pipeline that turned into booked meetings and closed revenue &mdash; not vanity metrics.</p>
      </div>

      <div className="results-grid">
        <article className="rcard rcard--a">
          <div className="rcard__top">
            <span className="rcard__co">OpenSponsorship</span>
            <span className="rcard__vert">Athlete marketing &middot; backed by Serena Williams</span>
          </div>
          <div className="rcard__body">
            <span className="rcard__metric">40+</span>{' '}
            <span className="rcard__mlabel">sales-qualified leads booked</span>
            <div className="rcard__subs">
              <div className="rcard__sub"><b>$170K</b>{' '}<span>pipeline</span></div>
              <div className="rcard__sub"><b>$10K</b>{' '}<span>closed</span></div>
              <div className="rcard__sub"><b>2,321</b>{' '}<span>contacted</span></div>
            </div>
            <p className="rcard__quote">&ldquo;The AI-personalized approach matched each brand&apos;s products with relevant athletes &mdash; pitches that actually resonated with CMOs.&rdquo;
              <span className="rcard__who">— OpenSponsorship team</span>
            </p>
          </div>
        </article>

        <article className="rcard rcard--b">
          <div className="rcard__top">
            <span className="rcard__co">Strategy Achievers</span>
            <span className="rcard__vert">Personal branding agency</span>
          </div>
          <div className="rcard__body">
            <span className="rcard__metric">$21K</span>{' '}
            <span className="rcard__mlabel">closed in the first few weeks</span>
            <div className="rcard__subs">
              <div className="rcard__sub"><b>$150K</b>{' '}<span>pipeline</span></div>
              <div className="rcard__sub"><b>~100</b>{' '}<span>leads</span></div>
              <div className="rcard__sub"><b>24 hrs</b>{' '}<span>to first replies</span></div>
            </div>
            <p className="rcard__quote">&ldquo;Within 24 hours we had around 6 leads. Within about 45 hours, that grew to 10 people ready to jump on calls.&rdquo;
              <span className="rcard__who">— Pascal, CEO</span>
            </p>
          </div>
        </article>

        <article className="rcard rcard--c">
          <div className="rcard__top">
            <span className="rcard__co">Vidify</span>
            <span className="rcard__vert">AI video generation &middot; B2B</span>
          </div>
          <div className="rcard__body">
            <span className="rcard__metric">103</span>{' '}
            <span className="rcard__mlabel">opportunities generated</span>
            <div className="rcard__subs">
              <div className="rcard__sub"><b>$133K</b>{' '}<span>pipeline</span></div>
              <div className="rcard__sub"><b>54</b>{' '}<span>in one month</span></div>
              <div className="rcard__sub"><b>3</b>{' '}<span>agencies before us</span></div>
            </div>
            <p className="rcard__quote">&ldquo;You weren&apos;t just executing &mdash; you were teaching us while delivering results. Last month alone, ~54 opportunities.&rdquo;
              <span className="rcard__who">— Ahmed, Director of PM</span>
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
