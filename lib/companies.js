import { getSupabase } from './supabase.js';

const EMPTY = { generatedAt: null, totalLeads: 0, companyCount: 0, companies: [] };
const PAGE = 1000; // PostgREST default max rows per request

/**
 * Returns the "companies we've emailed" rollup for a client, read from the
 * `companies` Supabase view (contacts grouped by source + domain). `source`
 * scopes to one EmailBison instance or 'all' (which re-aggregates by domain
 * across sources — double-counting contacts shared between instances, by
 * design). Keeps the dashboard's shape: { generatedAt, totalLeads,
 * companyCount, companies[] }. Degrades to an empty rollup on any error.
 */
export async function getEmailedCompanies(slug, source = 'all') {
  try {
    const sb = getSupabase();

    const rows = [];
    let from = 0;
    while (true) {
      let q = sb.from('companies').select('*').eq('client', slug);
      if (source !== 'all') q = q.eq('source', source);
      const { data, error } = await q.range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }

    // Merge per-source rows into one row per domain (only matters for 'all').
    const byDomain = new Map();
    for (const r of rows) {
      let row = byDomain.get(r.domain);
      if (!row) {
        row = { company: r.company ?? r.domain, domain: r.domain, emailsSent: 0, contacts: 0, _top: -1 };
        byDomain.set(r.domain, row);
      }
      row.emailsSent += Number(r.emails_sent ?? 0);
      row.contacts += Number(r.contacts ?? 0);
      // Keep the company name from the source with the most contacts.
      if (Number(r.contacts ?? 0) > row._top) {
        row._top = Number(r.contacts ?? 0);
        row.company = r.company ?? r.domain;
      }
    }
    const companies = [...byDomain.values()]
      .map(({ _top, ...c }) => c)
      .sort((a, b) => b.emailsSent - a.emailsSent || b.contacts - a.contacts);

    let contactsQ = sb.from('contacts').select('*', { count: 'exact', head: true }).eq('client', slug);
    if (source !== 'all') contactsQ = contactsQ.eq('source', source);
    const contactsRes = await contactsQ;
    const clientRes = await sb
      .from('clients')
      .select('last_synced_at')
      .eq('slug', slug)
      .maybeSingle();

    return {
      generatedAt: clientRes.data?.last_synced_at ?? null,
      totalLeads: contactsRes.count ?? 0,
      companyCount: companies.length,
      companies,
    };
  } catch (err) {
    console.error('getEmailedCompanies failed', err);
    return EMPTY;
  }
}
