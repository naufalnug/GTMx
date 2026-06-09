import './PositiveReplies.css';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ROLE_BUCKETS = [
  { key: 'founder', label: 'Founder / CEO', test: /\b(founder|ceo|cofounder|co-founder|owner|president)\b/i },
  { key: 'cxo', label: 'C-Suite', test: /\b(c[a-z]o|chief)\b/i },
  { key: 'vp', label: 'VP / Head', test: /\b(vp|vice president|head of|head,|svp|evp)\b/i },
  { key: 'director', label: 'Director', test: /\bdirector\b/i },
  { key: 'manager', label: 'Manager', test: /\b(manager|lead)\b/i },
];

function bucketTitle(title) {
  if (!title) return 'Other';
  for (const b of ROLE_BUCKETS) if (b.test.test(title)) return b.label;
  return 'Other';
}

function buildBreakdown(items, keyFn) {
  const counts = new Map();
  for (const x of items) {
    const k = keyFn(x);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const arr = [...counts.entries()].map(([label, count]) => ({ label, count }));
  arr.sort((a, b) => b.count - a.count);
  return arr.slice(0, 5);
}

function Breakdown({ label, items, total }) {
  if (!items.length) return null;
  return (
    <div className="pr-breakdown">
      <span className="eyebrow--code pr-breakdown__label">{`// ${label}`}</span>
      <ul className="pr-breakdown__list">
        {items.map((row) => {
          const pct = total > 0 ? (row.count / total) * 100 : 0;
          return (
            <li key={row.label} className="pr-breakdown__row">
              <span className="pr-breakdown__name">{row.label}</span>
              <span className="pr-breakdown__bar" aria-hidden="true">
                <span className="pr-breakdown__fill" style={{ width: `${Math.max(pct, 4)}%` }} />
              </span>
              <span className="pr-breakdown__count">{row.count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function PositiveReplies({ replies }) {
  const count = replies?.length ?? 0;
  const showBreakdown = count >= 3;

  const roleBreakdown = showBreakdown
    ? buildBreakdown(replies, (r) => bucketTitle(r.title))
    : [];
  const industryBreakdown = showBreakdown
    ? buildBreakdown(replies, (r) => r.industry || null)
    : [];

  return (
    <section id="positive" className="section positive-section">
      <div className="wrap">
        <div className="positive-head">
          <span className="eyebrow--code">// who_said_yes</span>
          <h2 className="h2">
            Who said <em>yes</em>
          </h2>
          <p className="lede positive-head-lede">
            Replies your team or EmailBison tagged as interested. The actual people in your pipeline right now.
          </p>
        </div>

        {showBreakdown && (roleBreakdown.length || industryBreakdown.length) ? (
          <div className="pr-breakdowns">
            <Breakdown label="by_role" items={roleBreakdown} total={count} />
            <Breakdown label="by_industry" items={industryBreakdown} total={count} />
          </div>
        ) : null}

        {count === 0 ? (
          <div className="card positive-empty">
            <p className="muted">
              No replies tagged as positive yet. Tag interested replies in your EmailBison inbox to populate this view.
            </p>
          </div>
        ) : (
          <ol className="positive-list">
            {replies.map((r) => (
              <li key={`${r.campaignId}-${r.id}`} className="card positive-card">
                <header className="positive-card__head">
                  <h3 className="h3 positive-card__name">
                    {r.fullName}
                    {r.title ? (
                      <>
                        , <em>{r.title}</em>
                      </>
                    ) : null}
                  </h3>
                  <span className="positive-card__date">{formatDate(r.dateReceived)}</span>
                </header>

                <div className="positive-card__meta">
                  <div className="positive-card__meta-left">
                    {r.company ? (
                      <span className="positive-card__company">{r.company}</span>
                    ) : null}
                    {r.industry ? (
                      <span className="positive-card__industry">{r.industry}</span>
                    ) : null}
                  </div>
                  {r.campaignName ? (
                    <span className="positive-card__from">
                      from{' '}
                      <a href={`#campaign-${r.campaignId}`}>{r.campaignName}</a>
                    </span>
                  ) : null}
                </div>

                {r.snippet ? (
                  <pre className="positive-card__snippet">{r.snippet}</pre>
                ) : (
                  <p className="positive-card__no-snippet muted">No reply text available.</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
