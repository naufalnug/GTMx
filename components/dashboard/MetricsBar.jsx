import './MetricsBar.css';

function formatInt(n) {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

function formatPct(n) {
  return `${n.toFixed(2)}%`;
}

export default function MetricsBar({ totals }) {
  const stats = [
    { num: formatInt(totals.sent), label: 'Emails sent' },
    { num: formatInt(totals.replies), label: 'Unique replies' },
    { num: formatPct(totals.replyRate), label: 'Reply rate' },
    { num: formatPct(totals.bounceRate), label: 'Bounce rate' },
  ];

  return (
    <section className="mbar dark">
      <div className="wrap">
        <div className="mbar__row">
          <span className="mbar__label">// totals_active_campaigns</span>
          <div className="mbar__stats">
            {stats.map((s) => (
              <div key={s.label} className="mbar__stat">
                <span className="mbar__num">{s.num}</span>
                <span className="mbar__sub">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
