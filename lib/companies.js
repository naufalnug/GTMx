import { getSql, queryOne } from './db.js';

const EMPTY = { generatedAt: null, totalLeads: 0, companyCount: 0, companies: [] };

/**
 * Returns the "companies we've emailed" rollup for a client, read from the
 * `companies` Neon view (contacts grouped by source + domain). `source` scopes
 * to one EmailBison instance or 'all' (which re-aggregates by domain across
 * sources — double-counting contacts shared between instances, by design).
 * Keeps the dashboard's shape: { generatedAt, totalLeads, companyCount,
 * companies[] }. Degrades to an empty rollup on any error.
 */
export async function getEmailedCompanies(slug, source = 'all') {
  try {
    const sql = getSql();

    const params = [slug];
    let where = 'client = $1';
    if (source !== 'all') {
      params.push(source);
      where += ` and source = $${params.length}`;
    }
    const rows = await sql.query(
      `select company, domain, emails_sent, contacts from companies where ${where}`,
      params
    );

    // Merge per-source rows into one row per company (only matters for 'all').
    // Keyed by company (the stable identifier) since domain is now a nullable
    // representative corporate domain, not the grouping key.
    const byCompany = new Map();
    for (const r of rows) {
      const key = (r.company ?? '').trim().toLowerCase() || `__nodomain_${r.domain ?? ''}`;
      let row = byCompany.get(key);
      if (!row) {
        row = { company: r.company ?? r.domain ?? '—', domain: r.domain ?? null, emailsSent: 0, contacts: 0, _top: -1 };
        byCompany.set(key, row);
      }
      row.emailsSent += Number(r.emails_sent ?? 0);
      row.contacts += Number(r.contacts ?? 0);
      // Prefer a real corporate domain if any source has one.
      if (!row.domain && r.domain) row.domain = r.domain;
      // Keep the company label from the source with the most contacts.
      if (Number(r.contacts ?? 0) > row._top) {
        row._top = Number(r.contacts ?? 0);
        row.company = r.company ?? row.company;
      }
    }
    const companies = [...byCompany.values()]
      .map(({ _top, ...c }) => c)
      .sort((a, b) => b.emailsSent - a.emailsSent || b.contacts - a.contacts);

    const countRow = await queryOne(
      sql,
      `select count(*)::int as count from contacts where ${where}`,
      params
    );
    const clientRow = await queryOne(
      sql,
      'select last_synced_at from clients where slug = $1',
      [slug]
    );

    return {
      generatedAt: clientRow?.last_synced_at ?? null,
      totalLeads: countRow?.count ?? 0,
      companyCount: companies.length,
      companies,
    };
  } catch (err) {
    console.error('getEmailedCompanies failed', err);
    return EMPTY;
  }
}
