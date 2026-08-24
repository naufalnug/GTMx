'use client';

import { useMemo, useState } from 'react';

/**
 * Daily activity: one plot, five measures, grouped bars per day.
 *
 * The measures span two orders of magnitude — sends run ~1,000/day while positive
 * replies run under ten — and they share one linear axis, because a second y-axis
 * would let two different scales masquerade as comparable. The honest way out is to
 * let the reader choose: every legend entry toggles its series, and the axis rescales
 * to whatever is left. Hide the two volume series and the response measures fill the
 * plot at a readable size.
 *
 * Series order is the funnel — added, sent, replied, positive, bounced — and doubles
 * as the bar order inside each day.
 *
 * Palette validated with the dataviz validator against the #fffdf9 surface: every
 * adjacent pair clears the CVD, normal-vision and 3:1 contrast gates. Green/red sit
 * in the 6-8 CVD band, legal here because identity never rests on colour alone — the
 * legend and tooltip name every measure in text, bars carry gaps, and a table view
 * repeats the numbers.
 */
const SERIES = [
  { key: 'contacts', label: 'Contacts added', color: '#b07d00' },
  { key: 'sent', label: 'Emails sent', color: '#2a78d6' },
  { key: 'replies', label: 'Replies', color: '#4a3aa7' },
  { key: 'positive', label: 'Positive replies', color: '#008300' },
  { key: 'bounced', label: 'Bounces', color: '#e34948' },
];

const int = (value) => new Intl.NumberFormat('en-US').format(value);

function shortDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function TrendChart({ points }) {
  const view = points.slice(-30);
  const [hidden, setHidden] = useState(() => new Set());
  const [hover, setHover] = useState(null);

  const visible = SERIES.filter((s) => !hidden.has(s.key));
  // Scale to what is actually on screen, so hiding the volume series makes the
  // response series legible instead of leaving them as slivers.
  const max = useMemo(() => {
    let top = 0;
    for (const point of view) {
      for (const series of visible) top = Math.max(top, Number(point[series.key] ?? 0));
    }
    return Math.max(top, 1);
  }, [view, visible]);

  if (!view.length) {
    return (
      <div className="chart-empty">
        <span>No sending activity in this period.</span>
      </div>
    );
  }

  function toggle(key) {
    setHidden((prev) => {
      const next = new Set(prev);
      // Never let the reader empty the plot entirely.
      if (next.has(key)) next.delete(key);
      else if (next.size < SERIES.length - 1) next.add(key);
      return next;
    });
  }

  const active = hover === null ? null : view[hover];

  return (
    <div className="chart">
      <div className="chart-legend">
        {SERIES.map((series) => {
          const off = hidden.has(series.key);
          return (
            <button
              key={series.key}
              type="button"
              className={`chart-key${off ? ' is-off' : ''}`}
              aria-pressed={!off}
              onClick={() => toggle(series.key)}
              title={off ? `Show ${series.label}` : `Hide ${series.label}`}
            >
              <span className="chart-swatch" style={{ background: series.color }} />
              {series.label}
            </button>
          );
        })}
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
          aria-label={`Daily activity for ${view.length} days. Series: ${visible
            .map((s) => s.label)
            .join(', ')}.`}
          onMouseLeave={() => setHover(null)}
        >
          <span className="chart-grid" />
          {view.map((point, index) => (
            <div
              key={point.date}
              className={`chart-day${hover === index ? ' is-hover' : ''}`}
              onMouseEnter={() => setHover(index)}
            >
              {visible.map((series) => {
                const value = Number(point[series.key] ?? 0);
                return (
                  <span
                    key={series.key}
                    className="chart-bar"
                    style={{
                      background: series.color,
                      // A non-zero day keeps a 2px floor so a single reply is still
                      // visible beside a 1,000-send day; a zero day stays empty.
                      height: value ? `max(2px, ${(value / max) * 100}%)` : '0',
                    }}
                  />
                );
              })}
            </div>
          ))}
          {active ? (
            <div
              className="chart-tip"
              style={{
                left: `${((hover + 0.5) / view.length) * 100}%`,
                transform: hover > view.length / 2 ? 'translateX(-100%)' : 'none',
              }}
            >
              <strong>{shortDate(active.date)}</strong>
              {SERIES.map((series) => (
                <span key={series.key} className={hidden.has(series.key) ? 'is-off' : ''}>
                  <i style={{ background: series.color }} />
                  {series.label}
                  <b>{int(Number(active[series.key] ?? 0))}</b>
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
