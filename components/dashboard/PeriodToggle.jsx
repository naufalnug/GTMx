'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PERIOD_OPTIONS } from '../../lib/period';
import './PeriodToggle.css';

export default function PeriodToggle({ period }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(period.key === 'custom');
  const [start, setStart] = useState(period.key === 'custom' ? period.start : '');
  const [end, setEnd] = useState(period.key === 'custom' ? period.end : '');

  function go(params) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function selectKey(key) {
    if (key === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    if (key === 'all') go({ period: null, start: null, end: null });
    else go({ period: key, start: null, end: null });
  }

  function applyCustom() {
    if (start && end && start <= end) {
      go({ period: 'custom', start, end });
    }
  }

  return (
    <div className="ptoggle">
      <span className="ptoggle__label">// period</span>
      <div className="ptoggle__chips" role="group" aria-label="Time period">
        {PERIOD_OPTIONS.map((opt) => {
          const isActive =
            opt.key === 'custom' ? showCustom || period.key === 'custom' : period.key === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              className={`ptoggle__chip${isActive ? ' is-active' : ''}`}
              onClick={() => selectKey(opt.key)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {showCustom ? (
        <div className="ptoggle__custom">
          <input
            type="date"
            className="ptoggle__date"
            value={start}
            max={end || undefined}
            onChange={(e) => setStart(e.target.value)}
            aria-label="Start date"
          />
          <span className="ptoggle__dash">→</span>
          <input
            type="date"
            className="ptoggle__date"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
            aria-label="End date"
          />
          <button
            type="button"
            className="ptoggle__apply"
            onClick={applyCustom}
            disabled={!start || !end || start > end}
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}
