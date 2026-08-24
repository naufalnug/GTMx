'use client';

import { useState } from 'react';

/**
 * Daily activity: one stacked bar per day, segmented by what happened to that day's
 * emails.
 *
 * The segments are deliberately MUTUALLY EXCLUSIVE. The underlying measures are
 * nested — positive replies are a subset of replies, which are a subset of sends — so
 * stacking them as-is would total 1,080 on a day when 1,005 emails went out, and the
 * bar would claim more activity than happened. Splitting into disjoint buckets makes
 * the stack sum to exactly "emails sent", which is what a part-to-whole bar must mean.
 *
 * Palette validated with the dataviz validator against the #fffdf9 surface: every
 * adjacent pair in the stack clears the CVD, normal-vision and 3:1 contrast gates with
 * no warnings. Green and red are never adjacent — bounces sit below replies, so the
 * best outcome caps the bar and the two most confusable hues stay apart.
 */
const SEGMENTS = [
  // Bottom to top. `no reply yet` is the remainder and wears a recessive neutral so
  // the outcomes read as the figure against it.
  { key: 'noReply', label: 'No reply yet', color: '#d8d2c4' },
  { key: 'bounced', label: 'Bounced', color: '#e34948' },
  { key: 'otherReplies', label: 'Replies', color: '#4a3aa7' },
  { key: 'positive', label: 'Positive replies', color: '#008300' },
];
const OUTCOMES = SEGMENTS.filter((s) => s.key !== 'noReply');

const int = (value) => new Intl.NumberFormat('en-US').format(value);

function shortDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Split a day into disjoint buckets that sum to the emails sent that day. */
export function split(point) {
  const sent = Number(point.sent ?? 0);
  const replies = Number(point.replies ?? 0);
  const bounced = Number(point.bounced ?? 0);
  const positive = Number(point.positive ?? 0);
  return {
    date: point.date,
    sent,
    replies,
    positive,
    // Positive replies are dated by when the reply arrived, not by campaign day, so on
    // a quiet day they can outnumber that day's replies. Clamp rather than go negative.
    otherReplies: Math.max(0, replies - positive),
    bounced,
    noReply: Math.max(0, sent - replies - bounced),
  };
}

export default function TrendChart({ points }) {
  const [outcomesOnly, setOutcomesOnly] = useState(false);
  const [hover, setHover] = useState(null);

  const view = points.slice(-30).map(split);
  const shown = outcomesOnly ? OUTCOMES : SEGMENTS;

  if (!view.length) {
    return (
      <div className="chart-empty">
        <span>No sending activity in this period.</span>
      </div>
    );
  }

  const totalOf = (day) => shown.reduce((sum, seg) => sum + Number(day[seg.key] ?? 0), 0);
  const max = Math.max(...view.map(totalOf), 1);
  const active = hover === null ? null : view[hover];

  return (
    <div className="chart">
      <div className="chart-legend">
        {[...SEGMENTS].reverse().map((seg) => (
          <span key={seg.key} className="chart-key">
            <span className="chart-swatch" style={{ background: seg.color }} />
            {seg.label}
          </span>
        ))}
        {/* Outcomes are ~5% of a day's sends, so they are thin slivers against the
            remainder. Dropping it rescales the bar to the outcomes alone. */}
        <button
          type="button"
          className={`chart-toggle${outcomesOnly ? ' is-on' : ''}`}
          aria-pressed={outcomesOnly}
          onClick={() => setOutcomesOnly((v) => !v)}
        >
          {outcomesOnly ? 'Show all sent' : 'Outcomes only'}
        </button>
      </div>

      <div className="chart-body">
        <div className="chart-yaxis" aria-hidden="true">
          <span>{int(max)}</span>
          <span>{int(Math.round(max / 2))}</span>
          <span>0</span>
        </div>
        <div
          className="chart-plot"
          role="img"
          aria-label={`Daily emails by outcome across ${view.length} days.`}
          onMouseLeave={() => setHover(null)}
        >
          <span className="chart-grid" />
          {view.map((day, index) => {
            const total = totalOf(day);
            return (
              <div
                key={day.date}
                className={`chart-day${hover === index ? ' is-hover' : ''}`}
                onMouseEnter={() => setHover(index)}
              >
                <span className="chart-stack" style={{ height: `${(total / max) * 100}%` }}>
                  {[...shown].reverse().map((seg) => {
                    const value = Number(day[seg.key] ?? 0);
                    if (!value) return null;
                    return (
                      <span
                        key={seg.key}
                        className="chart-seg"
                        style={{
                          background: seg.color,
                          // A 3px floor keeps a 9-out-of-1005 segment perceptible. It
                          // slightly overstates the smallest slices, which is why the
                          // tooltip and table carry the exact counts.
                          height: `max(3px, ${(value / total) * 100}%)`,
                        }}
                      />
                    );
                  })}
                </span>
              </div>
            );
          })}
          {active ? (
            <div
              className="chart-tip"
              style={{
                left: `${((hover + 0.5) / view.length) * 100}%`,
                transform: hover > view.length / 2 ? 'translateX(-100%)' : 'none',
              }}
            >
              <strong>{shortDate(active.date)}</strong>
              <span className="chart-tip-total">
                Emails sent<b>{int(active.sent)}</b>
              </span>
              {[...SEGMENTS].reverse().map((seg) => (
                <span key={seg.key}>
                  <i style={{ background: seg.color }} />
                  {seg.label}
                  <b>{int(Number(active[seg.key] ?? 0))}</b>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="chart-xaxis">
        <span>{shortDate(view[0].date)}</span>
        <span>{shortDate(view[view.length - 1].date)}</span>
      </div>

      <details className="chart-table">
        <summary>View as table</summary>
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Emails sent</th>
                {[...SEGMENTS].reverse().map((s) => (
                  <th key={s.key}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...view].reverse().map((day) => (
                <tr key={day.date}>
                  <td>{shortDate(day.date)}</td>
                  <td>{int(day.sent)}</td>
                  {[...SEGMENTS].reverse().map((s) => (
                    <td key={s.key}>{int(Number(day[s.key] ?? 0))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
