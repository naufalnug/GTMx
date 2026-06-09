import { htmlToPlainText } from '../../lib/emailbison';
import './CampaignCopy.css';

function formatInt(n) {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

function formatPct(n) {
  return `${n.toFixed(2)}%`;
}

export default function CampaignCopy({ campaigns }) {
  return (
    <section className="section copy-section">
      <div className="wrap">
        <div className="copy-head">
          <span className="eyebrow--code">// campaign_copy</span>
          <h2 className="h2">
            Sequence <em>copy</em>
          </h2>
          <p className="lede copy-head-lede">
            Every step that's running, as it's currently sending. Curly-brace placeholders are personalization variables that get filled in per-lead at send time.
          </p>
        </div>

        <div className="copy-list">
          {campaigns.map((c) => (
            <article key={c.id} id={`campaign-${c.id}`} className="card copy-card">
              <header className="copy-card__head">
                <h3 className="h3 copy-card__name">{c.name}</h3>
                <div className="copy-card__meta">
                  <span>{formatInt(c.sent)} sent</span>
                  <span className="copy-card__dot" aria-hidden="true">·</span>
                  <span>{c.replies} replies</span>
                  <span className="copy-card__dot" aria-hidden="true">·</span>
                  <span className="copy-card__rate">{c.interested} positive</span>
                  <span className="copy-card__dot" aria-hidden="true">·</span>
                  <span>{formatPct(c.replyRate)} reply</span>
                </div>
              </header>

              {c.steps.length === 0 ? (
                <p className="copy-empty">No sequence steps configured yet.</p>
              ) : (
                <ol className="copy-steps">
                  {c.steps.map((step, i) => {
                    const body = htmlToPlainText(step.body);
                    return (
                      <li key={step.id} className="copy-step">
                        <div className="copy-step__head">
                          <span className="copy-step__label">Step {i + 1}</span>
                          <span className="copy-step__meta">
                            wait {step.waitInDays}d
                            {step.threadReply ? ' · thread reply' : ''}
                          </span>
                        </div>
                        <div className="copy-step__subject">
                          <span className="copy-step__subject-label">Subject</span>
                          <span className="copy-step__subject-text">{step.subject}</span>
                        </div>
                        <pre className="copy-step__body">{body}</pre>
                      </li>
                    );
                  })}
                </ol>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
