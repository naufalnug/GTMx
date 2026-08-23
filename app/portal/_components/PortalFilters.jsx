'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function PortalFilters({ period, sources, source }) {
  const router = useRouter(); const pathname = usePathname(); const search = useSearchParams();
  function set(key, value) { const next = new URLSearchParams(search); if (!value || value === 'all' && key === 'period') next.delete(key); else next.set(key, value); router.push(`${pathname}?${next}`); }
  return <div className="portal-filters"><label><span>Reporting period</span><select value={period.key} onChange={(e) => set('period', e.target.value)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="ytd">Year to date</option><option value="all">All time</option></select></label>{sources.length > 1 ? <label><span>Sending source</span><select value={source} onChange={(e) => set('source', e.target.value)}><option value="all">All sources</option>{sources.map((item) => <option value={item} key={item}>{item}</option>)}</select></label> : null}</div>;
}
