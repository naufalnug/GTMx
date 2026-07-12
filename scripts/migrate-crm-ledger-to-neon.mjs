#!/usr/bin/env node
/**
 * One-time: create the crm_pushed_replies ledger in Neon and seed it with the
 * rows backfilled earlier (scripts/crm-ledger-seed.json). Idempotent — existing
 * rows are left untouched (ON CONFLICT DO NOTHING). This prevents the CRM push
 * from re-creating duplicate notes for replies already in Twenty.
 *
 *   node scripts/migrate-crm-ledger-to-neon.mjs
 *
 * Needs DATABASE_URL (Neon) in the environment / .env.local.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const { getSql } = await import('../lib/db.js');
const sql = getSql();

await sql.query(`
  create table if not exists crm_pushed_replies (
    workspace_id   text        not null,
    reply_id       bigint      not null,
    lead_id        bigint,
    email          text,
    crm_company_id uuid,
    crm_person_id  uuid,
    crm_note_id    uuid,
    pushed_at      timestamptz,
    error          text,
    updated_at     timestamptz not null default now(),
    primary key (workspace_id, reply_id)
  )
`);
await sql.query(
  `create index if not exists idx_crm_pushed_pending on crm_pushed_replies (workspace_id) where crm_note_id is null`
);

const seedPath = path.join(ROOT, 'scripts', 'crm-ledger-seed.json');
const rows = fs.existsSync(seedPath) ? JSON.parse(fs.readFileSync(seedPath, 'utf8')) : [];
let inserted = 0;
for (const r of rows) {
  const res = await sql.query(
    `insert into crm_pushed_replies
       (workspace_id, reply_id, lead_id, email, crm_company_id, crm_person_id, crm_note_id, pushed_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (workspace_id, reply_id) do nothing`,
    [r.workspace_id, r.reply_id, r.lead_id, r.email, r.crm_company_id, r.crm_person_id, r.crm_note_id, r.pushed_at]
  );
  inserted += res.length ?? 0;
}

const [{ count }] = await sql.query(`select count(*)::int as count from crm_pushed_replies where workspace_id = '29'`);
console.log(`Seeded ${rows.length} rows (new inserts: ${inserted}). Ledger now holds ${count} rows for workspace 29.`);
process.exit(0);
