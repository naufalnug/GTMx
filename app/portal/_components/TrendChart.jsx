'use client';

import { useState } from 'react';

/**
 * Daily activity as small multiples, one facet per measure.
 *
 * Sends run ~1,000/day while replies, positives and bounces run in the tens. Sharing
 * one y-axis makes every series except sends a sub-pixel sliver — which is what the
 * previous single-axis version did. Each facet therefore gets its own scale, and the
 * facet title carries identity so the colours are never compared side by side.
 *
 * Colour does semantic work only where it should: blue is neutral volume, green is
 * the outcome you want, red is the one you don't.
 */
const SERIES = [
  { key: 'sent', label: 'Emails sent', tone: 'volume' },
  { key: 'replies', label: 'Replies', tone: 'volume' },
  { key: 'positive', label: 'Positive replies', tone: 'good' },
  { key: 'bounced', label: 'Bounces', tone: 'bad' },
  { key: 'contacts', label: 'Contacts added', tone: 'volume', note: 'When lists were imported' },
];

const int = (value) => new Intl.NumberFormat('en-US').format(value);

function shortDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function Facet({ series, points }) {
  const [hover, setHover] = useState(null);
  const values = points.map((p) => Number(p[series.key] ?? 0));
  const total = values.reduce((sum, v) => sum + v, 0);
  const max = Math.max(...values, 1);
  const active = hover === null ? null : points[hover];

  return (
    <figure className={`facet facet--${series.tone}`}>
      <figcaption>
        <span>{series.label}</span>
        <strong>{int(total)}</strong>
        <small>{series.note ?? `Peak ${int(Math.max(...values, 0))} in a day`}</small>
      </figcaption>
      <div
        className="facet-plot"
        role="img"
        aria-label={`${series.label} per day. Total ${int(total)} across ${points.length} days.`}
        onMouseLeave={() => setHover(null)}
      >
        {points.map((p, i) => {
          const value = Number(p[series.key] ?? 0);
          return (
            <div
              key={p.date}
              className={`facet-col${hover === i ? ' is-hover' : ''}`}
              onMouseEnter={() => setHover(i)}
            >
              {/* A zero day stays empty; anything non-zero keeps a 3px floor so a
                  single reply is still visible next to a 1,000-send day. */}
              <span
                className="facet-bar"
                style={{ height: value ? `max(3px, ${(value / max) * 100}%)` : '0' }}
              />
            </div>
          );
        })}
      </div>
      <div className="facet-foot">
        {active ? (
          <span className="facet-readout">
            <b>{int(Number(active[series.key] ?? 0))}</b> on {shortDate(active.date)}
          </span>
        ) : (
          <>
            <span>{shortDate(points[0].date)}</span>
            <span>{shortDate(points[points.length - 1].date)}</span>
          </>
        )}
      </div>
    </figure>
  );
}

export default function TrendChart({ points }) {
  const view = points.slice(-30);
  if (!view.length) {
    return (
      <div className="chart-empty">
        <span>No sending activity in this period.</span>
      </div>
    );
  }
  return (
    <div className="facet-grid-wrap">
      <div className="facet-grid">
        {SERIES.map((series) => (
          <Facet key={series.key} series={series} points={view} />
        ))}
      </div>
      {/* Colour is never the only channel: the same numbers are readable as text. */}
      <details className="facet-table">
        <summary>View as table</summary>
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Day</th>
                {SERIES.map((s) => (
                  <th key={s.key}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...view].reverse().map((p) => (
                <tr key={p.date}>
                  <td>{shortDate(p.date)}</td>
                  {SERIES.map((s) => (
                    <td key={s.key}>{int(Number(p[s.key] ?? 0))}</td>
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
