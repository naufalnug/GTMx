export const PERIOD_OPTIONS = [
  { key: 'all', label: 'All time' },
  { key: '7d', label: 'Last 7 days' },
  { key: '2w', label: 'Past 2 weeks' },
  { key: '4w', label: 'Last 4 weeks' },
  { key: '3m', label: 'Last 3 months' },
  { key: '6m', label: 'Last 6 months' },
  { key: '12m', label: 'Last 12 months' },
  { key: 'custom', label: 'Custom' },
];

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function isYmd(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function startForKey(key, now) {
  const d = new Date(now);
  switch (key) {
    case '7d':
      d.setDate(d.getDate() - 6);
      return d;
    case '2w':
      d.setDate(d.getDate() - 13);
      return d;
    case '4w':
      d.setDate(d.getDate() - 27);
      return d;
    case '3m':
      d.setMonth(d.getMonth() - 3);
      return d;
    case '6m':
      d.setMonth(d.getMonth() - 6);
      return d;
    case '12m':
      d.setMonth(d.getMonth() - 12);
      return d;
    default:
      return null;
  }
}

/**
 * Resolves the requested period into a concrete window.
 * Returns { key, label, start, end } where start/end are YYYY-MM-DD, or null
 * for the all-time view. Falls back to all-time on unknown/invalid input.
 */
export function resolvePeriod(searchParams = {}, now = new Date()) {
  const rawKey = typeof searchParams.period === 'string' ? searchParams.period : 'all';
  const key = PERIOD_OPTIONS.some((p) => p.key === rawKey) ? rawKey : 'all';

  if (key === 'all') {
    return { key: 'all', label: 'All time', start: null, end: null };
  }

  if (key === 'custom') {
    const { start, end } = searchParams;
    if (isYmd(start) && isYmd(end) && start <= end) {
      return { key: 'custom', label: `${start} → ${end}`, start, end };
    }
    return { key: 'all', label: 'All time', start: null, end: null };
  }

  const opt = PERIOD_OPTIONS.find((p) => p.key === key);
  return { key, label: opt.label, start: ymd(startForKey(key, now)), end: ymd(now) };
}
