#!/usr/bin/env node
/**
 * Seed the notification feed with history that predates the feature, so a client
 * opening the bell for the first time sees their actual activity instead of an
 * empty panel.
 *
 * Writes two kinds, both of which have a trustworthy date or state to derive from:
 *   - lead.interested  for existing interested_replies (dated by date_received)
 *   - campaign.message_market_fit for campaigns that already qualify
 *
 * Deliberately NOT seeded: campaign.launched and campaign.leads_added. Nothing in
 * the schema records when a campaign was created or when leads were added, so any
 * date would be invented.
 *
 * Everything lands already-read (the watermark is bumped past it), so the badge
 * still starts at zero. Safe to re-run: inserts go through the same dedupe index
 * the sync uses.
 *
 *   node scripts/seed-portal-notifications.mjs            # every active client
 *   node scripts/seed-portal-notifications.mjs flexetc    # one client
 *   LEAD_LIMIT=50 node scripts/seed-portal-notifications.mjs
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

const LEAD_LIMIT = Number(process.env.LEAD_LIMIT ?? 25);
const MMF_MIN_CONTACTS = 100;
const MMF_MAX_RATIO = 500;

const PLACEHOLDER_NAMES = new Set(['there', 'there there', 'friend', 'hi there', 'team', 'unknown lead']);
function displayName(reply) {
  const full = String(reply.full_name ?? '').trim();
  if (full && !PLACEHOLDER_NAMES.has(full.toLowerCase())) return full;
  const company = String(reply.company ?? '').trim();
  if (company) return company;
  const domain = String(reply.email_domain ?? '').trim();
  if (domain) return domain;
  return String(reply.email ?? '').trim() || 'A lead';
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const only = process.argv[2];
const { data: clients, error: clientError } = await admin
  .from('clients').select('slug').eq('active', true);
if (clientError) throw clientError;
const targets = (clients ?? []).map((c) => c.slug).filter((slug) => !only || slug === only);
if (!targets.length) throw new Error(only ? `No active client "${only}".` : 'No active clients.');

let total = 0;
for (const slug of targets) {
  const rows = [];

  const { data: replies } = await admin
    .from('interested_replies')
    .select('reply_id, source, campaign_id, campaign_name, date_received, full_name, title, company, email, email_domain, subject')
    .eq('client', slug)
    .order('date_received', { ascending: false })
    .limit(LEAD_LIMIT);
  for (const reply of replies ?? []) {
    rows.push({
      client: slug,
      source: reply.source,
      kind: 'lead.interested',
      dedupe_key: `lead:${reply.source}:${reply.reply_id}`,
      title: `${displayName(reply)} is interested`,
      body: [reply.title, reply.company].filter(Boolean).join(' · ') || reply.subject || null,
      campaign_id: reply.campaign_id,
      campaign_name: reply.campaign_name,
      detail: { reply_id: reply.reply_id, email: reply.email, subject: reply.subject, seeded: true },
      event_at: reply.date_received ?? new Date().toISOString(),
    });
  }

  const { data: campaigns } = await admin
    .from('campaigns').select('campaign_id, source, name, contacts, interested').eq('client', slug);
  for (const c of campaigns ?? []) {
    const contacts = Number(c.contacts ?? 0);
    const interested = Number(c.interested ?? 0);
    if (!(interested >= 1 && contacts >= MMF_MIN_CONTACTS && contacts <= MMF_MAX_RATIO * interested)) continue;
    const ratio = Math.round(contacts / interested);
    rows.push({
      client: slug,
      source: c.source,
      kind: 'campaign.message_market_fit',
      dedupe_key: `mmf:${c.source}:${c.campaign_id}`,
      title: `Message–market fit: ${c.name || 'Untitled campaign'}`,
      body: `1 interested lead per ${ratio.toLocaleString('en-US')} contacts`,
      campaign_id: c.campaign_id,
      campaign_name: c.name,
      detail: { contacts, interested, ratio, seeded: true },
      event_at: new Date().toISOString(),
    });
  }

  if (!rows.length) { console.log(`${slug}: nothing to seed`); continue; }
  const { error } = await admin
    .from('portal_notifications')
    .upsert(rows, { onConflict: 'client,dedupe_key', ignoreDuplicates: true });
  if (error) throw error;
  total += rows.length;
  console.log(`${slug}: seeded up to ${rows.length} notification(s)`);
}

// Everything seeded counts as already seen — history to browse, badge at zero.
const { data: newest } = await admin
  .from('portal_notifications').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
await admin
  .from('portal_memberships')
  .update({ notifications_read_through_id: Number(newest?.id ?? 0) })
  .gt('notifications_read_through_id', -1);

console.log(`Done. ${total} row(s) offered; watermark set to ${newest?.id ?? 0} so nothing shows as unread.`);
