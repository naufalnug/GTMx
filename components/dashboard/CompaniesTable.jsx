'use client';

import { useMemo, useState } from 'react';
import './CompaniesTable.css';

const PAGE_SIZE = 50;

function formatInt(n) {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

const COLUMNS = [
  { key: 'company', label: 'Company', numeric: false },
  { key: 'domain', label: 'Domain', numeric: false },
  { key: 'contacts', label: 'Contacts', numeric: true },
  { key: 'emailsSent', label: 'Emails sent', numeric: true },
];

export default function CompaniesTable({ companies = [], generatedAt }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('emailsSent');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? companies.filter(
          (c) =>
            c.company?.toLowerCase().includes(q) ||
            c.domain?.toLowerCase().includes(q)
        )
      : companies;
    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...rows].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return sorted;
  }, [companies, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(COLUMNS.find((c) => c.key === key)?.numeric ? 'desc' : 'asc');
    }
    setPage(0);
  }

  function onSearch(e) {
    setQuery(e.target.value);
    setPage(0);
  }

  const snapshotDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <section id="companies" className="section comptable-section">
      <div className="wrap">
        <div className="comptable-head">
          <span className="eyebrow--code">// companies_emailed</span>
          <h2 className="h2">
            Companies we've <em>emailed</em>
          </h2>
          <p className="comptable-sub">
            {formatInt(companies.length)} companies contacted across all campaigns
            {snapshotDate ? ` · snapshot ${snapshotDate}` : ''}
          </p>
        </div>

        <div className="comptable-controls">
          <input
            type="search"
            className="comptable-search"
            placeholder="Search company or domain…"
            value={query}
            onChange={onSearch}
            aria-label="Search companies"
          />
          <span className="comptable-count">
            {formatInt(filtered.length)} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        <div className="card comptable-card">
          <div className="comptable-scroll">
            <table className="ctable comptable">
              <thead>
                <tr>
                  <th className="ctable__num-col">#</th>
                  {COLUMNS.map((col) => {
                    const isActive = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        className={col.numeric ? 'ctable__num-col' : undefined}
                      >
                        <button
                          type="button"
                          className={`comptable-sort${isActive ? ' is-active' : ''}`}
                          onClick={() => toggleSort(col.key)}
                        >
                          {col.label}
                          <span className="comptable-arrow" aria-hidden="true">
                            {isActive ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 1} className="comptable-empty">
                      {companies.length === 0
                        ? 'No company data available.'
                        : 'No companies match your search.'}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((c, i) => (
                    <tr key={c.domain}>
                      <td className="ctable__num ctable__muted">
                        {safePage * PAGE_SIZE + i + 1}
                      </td>
                      <td className="ctable__name">{c.company}</td>
                      <td className="comptable-domain">
                        <a
                          href={`https://${c.domain}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {c.domain}
                        </a>
                      </td>
                      <td className="ctable__num ctable__muted">{formatInt(c.contacts)}</td>
                      <td className="ctable__num">{formatInt(c.emailsSent)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pageCount > 1 && (
          <div className="comptable-pager">
            <button
              type="button"
              className="comptable-pagebtn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              ← Prev
            </button>
            <span className="comptable-pageinfo">
              Page {safePage + 1} of {pageCount}
            </span>
            <button
              type="button"
              className="comptable-pagebtn"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
