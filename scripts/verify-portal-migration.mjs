#!/usr/bin/env node
/**
 * Compare the old and new Supabase projects after a region migration.
 *
 * Checks the things that actually go wrong: a table that did not come across, RLS left
 * disabled (which would expose every client's data to every other client), the CRM
 * ledger short, and encrypted inbox settings that no longer decrypt.
 *
 *   TARGET_SUPABASE_URL=https://<new-ref>.supabase.co \
 *   TARGET_SUPABASE_SECRET_KEY=<new secret> \
 *   node scripts/verify-portal-migration.mjs
 *
 * Reads the OLD project from .env.local, so run it before swapping those over.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['.env.local', '.env']) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const oldDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const newDb = createClient(process.env.TARGET_SUPABASE_URL, process.env.TARGET_SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const DERIVED = new Set(['campaigns', 'campaign_daily_stats', 'sequence_steps', 'interested_replies', 'contacts']);
const TABLES = [
  'clients', 'campaigns', 'campaign_daily_stats', 'sequence_steps', 'interested_replies',
  'contacts', 'crm_pushed_replies', 'portal_memberships', 'portal_notifications',
  'portal_notification_reads', 'portal_audit_events',
];

let fail = 0;
const count = async (db, t) => {
  const { count: n, error } = await db.from(t).select('*', { count: 'exact', head: true });
  return error ? `ERR ${error.message.slice(0, 40)}` : n ?? 0;
};

console.log('table                        old        new   verdict');
console.log('-'.repeat(62));
for (const t of TABLES) {
  const [a, b] = await Promise.all([count(oldDb, t), count(newDb, t)]);
  let verdict;
  if (typeof b !== 'number') { verdict = 'FAIL (missing table?)'; fail += 1; }
  else if (t === 'crm_pushed_replies') {
    // Never rebuildable — must match exactly or the CRM gets duplicate pushes.
    verdict = a === b ? 'ok (exact)' : 'FAIL — CRM WILL DUPLICATE';
    if (a !== b) fail += 1;
  } else if (DERIVED.has(t)) {
    // Re-synced, so allow drift; only an empty table means the sync did not run.
    verdict = b > 0 ? 'ok (re-synced)' : 'FAIL — sync not run?';
    if (b === 0 && a > 0) fail += 1;
  } else {
    verdict = b >= a ? 'ok' : `FAIL — short by ${a - b}`;
    if (b < a) fail += 1;
  }
  console.log(`${t.padEnd(28)} ${String(a).padStart(6)} ${String(b).padStart(10)}   ${verdict}`);
}

// RLS is the one that must not be silently missing: without it any signed-in client can
// read every other client's contacts.
console.log('\nRLS check (anon must read nothing):');
const anonKey = process.env.TARGET_SUPABASE_PUBLISHABLE_KEY;
if (!anonKey) {
  console.log('  skipped — set TARGET_SUPABASE_PUBLISHABLE_KEY to run it');
} else {
  const anon = createClient(process.env.TARGET_SUPABASE_URL, anonKey, { auth: { persistSession: false } });
  for (const t of ['contacts', 'campaigns', 'interested_replies', 'portal_notifications']) {
    const { data, error } = await anon.from(t).select('*').limit(1);
    const blocked = error || !data?.length;
    console.log(`  ${t.padEnd(24)} ${blocked ? 'ok — blocked' : 'FAIL — READABLE BY ANON'}`);
    if (!blocked) fail += 1;
  }
}

// Encrypted inbox settings only survive if PORTAL_ENCRYPTION_KEY came across unchanged.
console.log('\nEncrypted inbox settings:');
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
require.cache[require.resolve('server-only')] = { id: 'server-only', filename: 'server-only', loaded: true, exports: {} };
const { decryptPortalValue } = await import('../lib/portalCrypto.js');
const { data: rows } = await newDb.from('clients').select('slug, inbox_url_ciphertext').not('inbox_url_ciphertext', 'is', null);
for (const r of rows ?? []) {
  try {
    const v = decryptPortalValue(r.inbox_url_ciphertext);
    console.log(`  ${r.slug.padEnd(24)} ok — decrypts to ${String(v).slice(0, 42)}`);
  } catch {
    console.log(`  ${r.slug.padEnd(24)} FAIL — will not decrypt (PORTAL_ENCRYPTION_KEY changed?)`);
    fail += 1;
  }
}

console.log(fail ? `\n${fail} check(s) FAILED — do not cut over yet.` : '\nAll checks passed.');
process.exit(fail ? 1 : 0);
