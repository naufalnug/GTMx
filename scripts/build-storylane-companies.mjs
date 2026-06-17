#!/usr/bin/env node
/**
 * Build a snapshot of every company Storylane has emailed.
 *
 * The EmailBison leads endpoint hard-caps at 15 rows/page (~1,072 pages for
 * Storylane), which is far too heavy to fetch on each dashboard render. So we
 * page through it once here, aggregate leads to companies by email domain, and
 * write data/storylane-companies.json. The dashboard reads that file instantly.
 *
 * Re-run whenever the client wants a fresh snapshot:
 *   node scripts/build-storylane-companies.mjs
 *
 * Reads EMAILBISON_INSTANCE_URL + EMAILBISON_STORYLANE_API_KEY from the
 * environment, falling back to .env.local so it "just works" locally.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(ROOT, 'data', 'storylane-companies.json');
const MAX_RETRIES = 3;
const MAX_PAGES = 5000; // safety stop (~75k leads at 15/page)

function loadEnv() {
  const env = { ...process.env };
  const file = path.join(ROOT, '.env.local');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] == null) {
        env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return env;
}

function extractEmailDomain(email) {
  if (!email || typeof email !== 'string') return '';
  const at = email.lastIndexOf('@');
  if (at < 0) return '';
  return email.slice(at + 1).trim().toLowerCase();
}

/**
 * Offset pagination is capped at page 1000 (15k rows) by EmailBison, so we use
 * cursor pagination (pagination_type=cursor → meta.next_cursor) which has no
 * depth limit. Cursors are sequential, so this fetch must run page-by-page.
 */
async function fetchCursor({ base, key }, cursor) {
  const qs =
    'filters[emails_sent][criteria]=>=&filters[emails_sent][value]=1' +
    '&pagination_type=cursor' +
    (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
  const url = `${base}/api/leads?${qs}`;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw new Error(`cursor page failed after ${MAX_RETRIES} tries: ${lastErr?.message}`);
}

function aggregate(leads) {
  const byDomain = new Map();
  for (const lead of leads) {
    const domain = extractEmailDomain(lead?.email);
    if (!domain) continue;
    const sent = Number(lead?.overall_stats?.emails_sent ?? 0);
    let row = byDomain.get(domain);
    if (!row) {
      row = { domain, emailsSent: 0, contacts: 0, names: new Map() };
      byDomain.set(domain, row);
    }
    row.emailsSent += sent;
    row.contacts += 1;
    const name = (lead?.company ?? '').trim();
    if (name) row.names.set(name, (row.names.get(name) ?? 0) + 1);
  }

  const companies = [...byDomain.values()].map((row) => {
    let company = row.domain;
    let best = 0;
    for (const [name, count] of row.names) {
      if (count > best) {
        best = count;
        company = name;
      }
    }
    return {
      company,
      domain: row.domain,
      emailsSent: row.emailsSent,
      contacts: row.contacts,
    };
  });

  companies.sort(
    (a, b) =>
      b.emailsSent - a.emailsSent ||
      b.contacts - a.contacts ||
      a.domain.localeCompare(b.domain)
  );
  return companies;
}

async function main() {
  const env = loadEnv();
  const base = env.EMAILBISON_INSTANCE_URL;
  const key = env.EMAILBISON_STORYLANE_API_KEY;
  if (!base || !key) {
    console.error(
      'Missing EMAILBISON_INSTANCE_URL or EMAILBISON_STORYLANE_API_KEY (env or .env.local).'
    );
    process.exit(1);
  }

  const config = { base, key };
  console.log('Fetching emailed leads from EmailBison (cursor pagination)…');

  const leads = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = await fetchCursor(config, cursor);
    const batch = res?.data ?? [];
    leads.push(...batch);
    cursor = batch.length ? res?.meta?.next_cursor ?? null : null;
    pages += 1;
    if (pages % 20 === 0 || !cursor) {
      process.stdout.write(`\r  fetched ${leads.length} leads (${pages} pages)…`);
    }
  } while (cursor && pages < MAX_PAGES);
  process.stdout.write('\n');

  const companies = aggregate(leads);
  const snapshot = {
    generatedAt: new Date().toISOString(),
    totalLeads: leads.length,
    companyCount: companies.length,
    companies,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2));
  console.log(
    `Wrote ${companies.length} companies (${leads.length} leads) to ${path.relative(ROOT, OUT_FILE)}`
  );
}

main().catch((err) => {
  console.error('\nSnapshot build failed:', err.message);
  process.exit(1);
});
