'use client';

import { useEffect, useRef, useState } from 'react';
import './SectionNav.css';

const LINKS = [
  { href: '#positive', label: 'Positive replies' },
  { href: '#campaigns', label: 'Campaigns' },
  { href: '#companies', label: 'Companies emailed' },
  { href: '#observations', label: 'Observations' },
  { href: '#copy', label: 'Sequence copy' },
];

export default function SectionNav() {
  const [active, setActive] = useState('positive');
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!els.length) return;

    const visibility = new Map(ids.map((id) => [id, 0]));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visibility.set(e.target.id, e.intersectionRatio);
        }
        let best = ids[0];
        let bestRatio = -1;
        for (const id of ids) {
          const r = visibility.get(id) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            best = id;
          }
        }
        if (bestRatio > 0) setActive(best);
      },
      {
        rootMargin: '-80px 0px -50% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="snav-sentinel" />
      <nav className={`snav${stuck ? ' snav--stuck' : ''}`} aria-label="Dashboard sections">
        <div className="wrap snav__inner">
          <ul className="snav__list">
            {LINKS.map((l) => {
              const id = l.href.slice(1);
              const isActive = active === id;
              return (
                <li key={l.href} className="snav__item">
                  <a
                    href={l.href}
                    className={`snav__link${isActive ? ' is-active' : ''}`}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
