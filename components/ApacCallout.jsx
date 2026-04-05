import './ApacCallout.css'

const MARKETS = [
  { flag: '\u{1F1F8}\u{1F1EC}', name: 'Singapore' },
  { flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia' },
  { flag: '\u{1F1EE}\u{1F1E9}', name: 'Indonesia' },
  { flag: '\u{1F1F2}\u{1F1FE}', name: 'Malaysia' },
  { flag: '\u{1F1EF}\u{1F1F5}', name: 'Japan' },
  { flag: '\u{1F1F3}\u{1F1FF}', name: 'New Zealand' },
]

function ApacCallout() {
  return (
    <section className="apac-callout" id="apac">
      <div className="apac-callout__inner">
        <span className="apac-callout__label">// apac_native</span>
        <h3 className="apac-callout__title">
          Built for APAC markets — not retrofitted for them.
        </h3>
        <p className="apac-callout__desc">
          Most GTM playbooks are written for the US market and bolted onto APAC as an
          afterthought. We build outbound engines that account for what actually matters
          in this region: relationship-first sales cultures, multi-market territory
          complexity, local data sourcing, and sequences that convert where US playbooks fall flat.
        </p>
        <div className="apac-callout__markets">
          {MARKETS.map(m => (
            <span key={m.name} className="apac-callout__market">
              {m.flag} {m.name}
            </span>
          ))}
          <span className="apac-callout__market apac-callout__market--more">+ more</span>
        </div>
        <p className="apac-callout__tz">
          Timezones covered: <strong>SGT (UTC+8) &middot; AEST (UTC+10) &middot; JST (UTC+9) &middot; WIB (UTC+7) &middot; NZST (UTC+12)</strong>
        </p>
      </div>
    </section>
  )
}

export default ApacCallout
