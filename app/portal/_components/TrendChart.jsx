'use client';

import { useId, useState } from 'react';

/**
 * Daily activity as a smoothed area chart — one line per measure, gradient fill
 * beneath, shared y-axis.
 *
 * Curves use monotone cubic interpolation rather than a plain spline. A spline
 * overshoots between points, which on counts invents dips below zero and peaks that
 * never happened; monotone stays inside the data.
 *
 * On colour: brand identity here comes from the surface, ink hairlines, type and the
 * offset-shadow tooltip — NOT from the series hues. GTMx flame (#e8552b) was tried as
 * a series colour and fails hard against the green (CVD ΔE 2.4, indistinguishable for
 * protanopes), so the marks use a validated set instead. Every pair clears the CVD,
 * normal-vision and 3:1 contrast gates against the #fffdf9 surface. Green/red sit in
 * the 6-8 band, legal because the legend and tooltip name every series in text.
 */
const SERIES = [
  { key: 'sent', label: 'Sent', color: '#2a78d6' },
  { key: 'replies', label: 'Replied', color: '#4a3aa7' },
  { key: 'positive', label: 'Interested', color: '#008300' },
  { key: 'bounced', label: 'Bounced', color: '#e34948' },
];
const OUTCOMES = SERIES.filter((s) => s.key !== 'sent');

const W = 1000;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 30, left: 54 };

const int = (v) => new Intl.NumberFormat('en-US').format(v);

function shortDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Round the axis ceiling so ticks read 4,000 rather than 3,847. */
function niceMax(value) {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => value <= s * pow) ?? 10;
  return step * pow;
}

/**
 * Monotone cubic Hermite path. Tangents are clamped so no segment overshoots the
 * points it joins — the curve cannot dip below zero between two small counts.
 */
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : '';
  const n = pts.length;
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx.push(pts[i + 1].x - pts[i].x);
    slope.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x));
  }
  const m = [slope[0]];
  for (let i = 1; i < n - 1; i += 1) {
    if (slope[i - 1] * slope[i] <= 0) {
      m.push(0);
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m.push((w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]));
    }
  }
  m.push(slope[n - 2]);

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i] / 3;
    d += ` C${pts[i].x + h},${pts[i].y + m[i] * h} ${pts[i + 1].x - h},${
      pts[i + 1].y - m[i + 1] * h
    } ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

export default function TrendChart({ points }) {
  const uid = useId().replace(/:/g, '');
  const [outcomesOnly, setOutcomesOnly] = useState(false);
  const [hover, setHover] = useState(null);

  const view = points.slice(-30);
  const shown = outcomesOnly ? OUTCOMES : SERIES;

  if (view.length < 2) {
    return (
      <div className="chart-empty">
        <span>Not enough activity yet to plot a trend.</span>
      </div>
    );
  }

  const max = niceMax(Math.max(...view.flatMap((p) => shown.map((s) => Number(p[s.key] ?? 0))), 1));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (i / (view.length - 1)) * plotW;
  const y = (v) => PAD.top + plotH - (v / max) * plotH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  // Roughly six date labels whatever the window length.
  const labelEvery = Math.max(1, Math.ceil(view.length / 6));
  const active = hover === null ? null : view[hover];

  return (
    <div className="chart">
      <div className="chart-head">
        <button
          type="button"
          className={`chart-toggle${outcomesOnly ? ' is-on' : ''}`}
          aria-pressed={outcomesOnly}
          onClick={() => setOutcomesOnly((v) => !v)}
        >
          {outcomesOnly ? 'Show sent volume' : 'Outcomes only'}
        </button>
      </div>

      <div className="chart-frame">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="chart-svg"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Daily ${shown.map((s) => s.label).join(', ')} across ${view.length} days.`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const rel = ((event.clientX - box.left) / box.width) * W;
            const i = Math.round(((rel - PAD.left) / plotW) * (view.length - 1));
            setHover(Math.min(view.length - 1, Math.max(0, i)));
          }}
        >
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.34" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                className="chart-gridline"
              />
              <text x={PAD.left - 12} y={y(t) + 4} className="chart-tick" textAnchor="end">
                {int(t)}
              </text>
            </g>
          ))}

          {shown.map((s) => {
            const pts = view.map((p, i) => ({ x: x(i), y: y(Number(p[s.key] ?? 0)) }));
            const line = smoothPath(pts);
            return (
              <g key={s.key}>
                <path
                  d={`${line} L${x(view.length - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                  fill={`url(#${uid}-${s.key})`}
                />
                <path d={line} className="chart-line" stroke={s.color} />
              </g>
            );
          })}

          {view.map((p, i) =>
            i % labelEvery === 0 || i === view.length - 1 ? (
              <text key={p.date} x={x(i)} y={H - 8} className="chart-tick" textAnchor="middle">
                {shortDate(p.date)}
              </text>
            ) : null
          )}

          {active ? (
            <g pointerEvents="none">
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                className="chart-crosshair"
              />
              {shown.map((s) => (
                <circle
                  key={s.key}
                  cx={x(hover)}
                  cy={y(Number(active[s.key] ?? 0))}
                  r="4.5"
                  fill={s.color}
                  className="chart-dot"
                />
              ))}
            </g>
          ) : null}
        </svg>

        {active ? (
          <div
            className="chart-tip"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: hover > view.length / 2 ? 'translateX(-108%)' : 'translateX(8%)',
            }}
          >
            <strong>{shortDate(active.date)}</strong>
            {SERIES.map((s) => (
              <span key={s.key} className={shown.includes(s) ? '' : 'is-off'}>
                <i style={{ background: s.color }} />
                {s.label}
                <b>{int(Number(active[s.key] ?? 0))}</b>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="chart-legend">
        {SERIES.map((s) => (
          <span key={s.key} className={`chart-key${shown.includes(s) ? '' : ' is-off'}`}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
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
