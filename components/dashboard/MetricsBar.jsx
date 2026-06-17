import PeriodToggle from './PeriodToggle';
import SourceToggle from './SourceToggle';
import './MetricsBar.css';

function formatInt(n) {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

function formatPct(n) {
  return `${n.toFixed(2)}%`;
}

export default function MetricsBar({ totals, period, sources, source }) {
  const hasReplies = totals.replies > 0;
  const windowed = period && period.key !== 'all';
  const stats = [
    { key: 'sent', num: formatInt(totals.sent), label: 'Emails sent' },
    { key: 'replies', num: formatInt(totals.replies), label: 'Replies' },
    {
      key: 'positive',
      num: formatInt(totals.interested),
      label: 'Positive replies',
      sub: hasReplies ? `${formatPct(totals.interestedRate)} of replies` : null,
      accent: true,
    },
    { key: 'replyRate', num: formatPct(totals.replyRate), label: 'Reply rate' },
    { key: 'bounceRate', num: formatPct(totals.bounceRate), label: 'Bounce rate' },
    {
      key: 'contacts',
      num: formatInt(totals.contacts),
      label: 'Contacts emailed',
      sub: windowed ? 'all time' : null,
    },
  ];

  return (
    <section className="mbar dark">
      <div className="wrap">
        {sources && sources.length > 1 ? (
          <SourceToggle sources={sources} source={source} />
        ) : null}
        {period ? <PeriodToggle period={period} /> : null}
        <div className="mbar__row">
          <span className="mbar__label">
            // totals · {(period?.label ?? 'all time').toLowerCase()}
          </span>
          <div className="mbar__stats">
            {stats.map((s) => (
              <div key={s.key} className="mbar__stat">
                <span className={`mbar__num${s.accent ? ' mbar__num--accent' : ''}`}>
                  {s.num}
                </span>
                <span className="mbar__sub">{s.label}</span>
                {s.sub ? <span className="mbar__subnote">{s.sub}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
