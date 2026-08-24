#!/usr/bin/env node
/**
 * Restore non-derived portal state into a freshly migrated Supabase project.
 *
 * Run AFTER `supabase db push` has created the schema in the new project, and BEFORE
 * re-running the sync. Point the env at the NEW project.
 *
 *   TARGET_SUPABASE_URL=https://<new-ref>.supabase.co \
 *   TARGET_SUPABASE_SECRET_KEY=<new secret key> \
 *   node scripts/import-portal-state.mjs outputs/portal-state-YYYY-MM-DD.json
 *
 * What it carries, and why:
 *  - crm_pushed_replies — the CRM dedupe ledger. NOT rebuildable. Losing it re-pushes
 *    every interested reply into Twenty as a duplicate company/person/note.
 *  - clients — brand colour, default source, active flag, and the ENCRYPTED inbox url
 *    and credentials. Only decryptable if PORTAL_ENCRYPTION_KEY is carried over too.
 *  - auth users + memberships — recreated by email. User ids change, so memberships are
 *    remapped rather than copied.
 *  - portal_notifications — carried so clients keep their history, with the read
 *    watermark recomputed against the new ids.
 *
 * Everything else (campaigns, contacts, daily stats, interested replies) is rebuilt by
 * `npm run sync` afterwards.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/import-portal-state.mjs <export.json>');
const url = process.env.TARGET_SUPABASE_URL;
const key = process.env.TARGET_SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Set TARGET_SUPABASE_URL and TARGET_SUPABASE_SECRET_KEY (the NEW project).');

const state = JSON.parse(fs.readFileSync(file, 'utf8'));
if (state.source && url.includes(new URL(state.source).hostname.split('.')[0])) {
  throw new Error('Target looks identical to the export source — refusing to import onto itself.');
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

console.log(`Importing ${file}\n  from ${state.source}\n  into ${url}\n`);

// 1. clients — migrations already inserted the rows; this restores per-deployment settings.
for (const c of state.clients) {
  const { error } = await admin.from('clients').upsert(
    {
      slug: c.slug,
      name: c.name,
      instance_url: c.instance_url,
      workspace_id: c.workspace_id,
      logo_src: c.logo_src,
      brand_color: c.brand_color,
      active: c.active,
      default_source: c.default_source,
      inbox_url_ciphertext: c.inbox_url_ciphertext,
      inbox_provider: c.inbox_provider,
      inbox_credentials_ciphertext: c.inbox_credentials_ciphertext,
      // last_synced_at / sync_error deliberately omitted — the re-sync sets them.
    },
    { onConflict: 'slug' }
  );
  if (error) throw error;
}
console.log(`clients                 ${state.clients.length} restored`);

// 2. auth users. Passwords cannot be exported, so each gets a fresh random one that
//    must be reset. Ids change, which is why memberships are remapped below.
const idByEmail = new Map();
const tempPasswords = [];
for (const u of state.authUsers) {
  const password = crypto.randomBytes(18).toString('base64url');
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password,
    email_confirm: true,
    app_metadata: u.app_metadata,
  });
  if (error) {
    // Already present (re-run) — look it up instead of failing the whole import.
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const found = (list?.users ?? []).find((x) => x.email === u.email);
    if (!found) throw error;
    idByEmail.set(u.email, found.id);
    console.log(`auth user               ${u.email} already existed`);
    continue;
  }
  idByEmail.set(u.email, data.user.id);
  tempPasswords.push([u.email, password]);
}
console.log(`auth users              ${idByEmail.size} present`);

// 3. memberships, remapped onto the new user ids.
const oldIdToEmail = new Map(state.authUsers.map((u) => [u.id, u.email]));
for (const m of state.memberships) {
  const email = oldIdToEmail.get(m.user_id);
  const newId = email ? idByEmail.get(email) : null;
  if (!newId) {
    console.error(`  ! membership for client ${m.client_slug} has no matching user — skipped`);
    continue;
  }
  const { error } = await admin
    .from('portal_memberships')
    .upsert({ user_id: newId, client_slug: m.client_slug }, { onConflict: 'user_id' });
  if (error) throw error;
}
console.log(`portal_memberships      ${state.memberships.length} remapped`);

// 4. CRM ledger — verbatim, and the reason this script exists.
if (state.crmPushedReplies.length) {
  const { error } = await admin
    .from('crm_pushed_replies')
    .upsert(state.crmPushedReplies, { onConflict: 'workspace_id,reply_id' });
  if (error) throw error;
}
console.log(`crm_pushed_replies      ${state.crmPushedReplies.length} restored (prevents duplicate CRM pushes)`);

// 5. notifications, minus their old ids so the new project assigns its own.
if (state.notifications.length) {
  const rows = state.notifications.map(({ id, ...rest }) => rest);
  const { error } = await admin
    .from('portal_notifications')
    .upsert(rows, { onConflict: 'client,dedupe_key', ignoreDuplicates: true });
  if (error) throw error;
}
const { data: newest } = await admin
  .from('portal_notifications').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
await admin
  .from('portal_memberships')
  .update({ notifications_read_through_id: Number(newest?.id ?? 0) })
  .gt('notifications_read_through_id', -1);
console.log(`portal_notifications    ${state.notifications.length} restored, watermark reset to ${newest?.id ?? 0}`);

console.log('\nNEXT: run `npm run sync` to rebuild campaigns, contacts, daily stats and replies.');
if (tempPasswords.length) {
  console.log('\nTemporary passwords — every account needs a reset, hashes are not exportable:');
  for (const [email, pw] of tempPasswords) console.log(`  ${email.padEnd(32)} ${pw}`);
}
