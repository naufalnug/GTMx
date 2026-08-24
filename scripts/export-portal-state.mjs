#!/usr/bin/env node
/**
 * Export the portal state that CANNOT be rebuilt from EmailBison.
 *
 * ~99% of this database is derived: campaigns, contacts, daily stats and interested
 * replies all come back by re-running the sync. What does not come back is the handful
 * of rows below, so they are what a region migration actually has to carry.
 *
 * Writes JSON to outputs/portal-state-<date>.json (gitignored via *.local? no — the
 * file contains client emails, so keep it out of the repo).
 *
 *   node scripts/export-portal-state.mjs
 *
 * Restore into a new project with scripts/import-portal-state.mjs.
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

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const state = { exportedAt: new Date().toISOString(), source: process.env.NEXT_PUBLIC_SUPABASE_URL };

// clients: recreated by migrations, but brand colours, inbox ciphertext and provider
// are per-deployment settings that the migrations do not carry.
const { data: clients, error: clientErr } = await admin.from('clients').select('*');
if (clientErr) throw clientErr;
state.clients = clients;

const { data: memberships, error: memErr } = await admin.from('portal_memberships').select('*');
if (memErr) throw memErr;
state.memberships = memberships;

const { data: notifications } = await admin
  .from('portal_notifications')
  .select('*')
  .order('id');
state.notifications = notifications ?? [];

const { data: reads } = await admin.from('portal_notification_reads').select('*');
state.notificationReads = reads ?? [];

const { data: audit } = await admin.from('portal_audit_events').select('*').order('id');
state.auditEvents = audit ?? [];

const { data: ledger } = await admin.from('crm_pushed_replies').select('*');
state.crmPushedReplies = ledger ?? [];

// Auth users. Password hashes are NOT retrievable through the admin API, so accounts
// must be recreated with fresh passwords on the far side — noted loudly rather than
// discovered at cutover.
const { data: users, error: userErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (userErr) throw userErr;
state.authUsers = (users?.users ?? []).map((u) => ({
  id: u.id,
  email: u.email,
  app_metadata: u.app_metadata,
  created_at: u.created_at,
}));

const outDir = path.join(ROOT, 'outputs');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `portal-state-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(out, JSON.stringify(state, null, 2));

console.log(`Wrote ${out}`);
console.log(`  clients                ${state.clients.length}`);
console.log(`  portal_memberships     ${state.memberships.length}`);
console.log(`  auth users             ${state.authUsers.length}  (passwords NOT exportable — must be reset)`);
console.log(`  portal_notifications   ${state.notifications.length}`);
console.log(`  notification reads     ${state.notificationReads.length}`);
console.log(`  audit events           ${state.auditEvents.length}`);
console.log(`  crm_pushed_replies     ${state.crmPushedReplies.length}`);
console.log('\nEverything else (campaigns, contacts, daily stats, interested replies) rebuilds via `npm run sync`.');
