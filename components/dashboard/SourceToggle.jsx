'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import './SourceToggle.css';

// Friendly labels for EmailBison instance sources. 'gtmx' is the live account,
// 'dedi' the older/archived one. Unknown sources fall back to their raw name.
const LABELS = { gtmx: 'Live', dedi: 'Archive' };

export default function SourceToggle({ sources, source }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(value) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === 'all') next.delete('source');
    else next.set('source', value);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const options = [
    ...sources.map((s) => ({ value: s, label: LABELS[s] ?? s })),
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="stoggle">
      <span className="stoggle__label">// source</span>
      <div className="stoggle__chips" role="group" aria-label="Data source">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`stoggle__chip${source === opt.value ? ' is-active' : ''}`}
            onClick={() => go(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
