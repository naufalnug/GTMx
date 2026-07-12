// EmailBison (GTMx workspace) -> Twenty CRM pipeline.
//
// Pulls "interested" replies from the GTMx EmailBison workspace and pushes each
// into Twenty as Company + Contact + Note (reply body), idempotently. Shared by
// the real-time webhook (app/api/webhooks/emailbison) and the reconciliation
// cron (app/api/cron/sync-crm). Idempotency is enforced by the Neon
// `crm_pushed_replies` ledger: a reply with a crm_note_id is never reprocessed.

import { getSql, queryOne } from './db.js';
import { normalizeInterestedReply } from './emailbison.js';
import { upsertCompany, upsertPerson, createReplyNote, linkNote, isConfigured } from './twenty.js';

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000;
const LEDGER_TABLE = 'crm_pushed_replies';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GTMx EmailBison config from env. Returns null when not configured (skip, not fatal). */
export function getGtmxConfig() {
  const apiKey = process.env.EMAILBISON_GTMX_API_KEY;
  const baseUrl = process.env.EMAILBISON_GTMX_INSTANCE_URL || 'https://send.gtmx.run';
  if (!apiKey) return null;
  // API keys are "ID|TOKEN"; the ID is the workspace id (GTMx = 29).
  const workspaceId = String(apiKey.split('|')[0] || '').trim() || 'gtmx';
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey, workspaceId };
}

async function ebGet(cfg, path) {
  const url = `${cfg.baseUrl}${path}`;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cfg.apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(400 * attempt);
    }
  }
  throw new Error(`EmailBison ${path} failed after ${MAX_RETRIES} tries: ${lastErr?.message}`);
}

/** A single reply by id (includes text_body). */
export async function getReply(cfg, replyId) {
  const d = await ebGet(cfg, `/api/replies/${replyId}`);
  return d?.data ?? null;
}

/** A single lead by id (name, title, company, custom_variables). */
export async function getLead(cfg, leadId) {
  const d = await ebGet(cfg, `/api/leads/${leadId}`);
  return d?.data ?? d ?? null;
}

/** The most recent interested reply for a given lead, or null. */
export async function getLatestInterestedReplyForLead(cfg, leadId) {
  const d = await ebGet(cfg, `/api/replies?lead_id=${leadId}&status=interested&page=1`).catch(() => null);
  const items = (d?.data ?? []).filter((r) => r?.interested === true);
  if (!items.length) return null;
  items.sort((a, b) => {
    const da = Date.parse(a?.date_received ?? a?.created_at ?? 0) || 0;
    const db = Date.parse(b?.date_received ?? b?.created_at ?? 0) || 0;
    return db - da;
  });
  return items[0];
}

/** Yields interested replies across the whole workspace, one page at a time. */
export async function* iterateInterestedReplies(cfg, { maxPages = 100 } = {}) {
  const first = await ebGet(cfg, `/api/replies?status=interested&page=1`);
  const items = first?.data ?? [];
  if (items.length) yield items;
  const lastPage = Number(first?.meta?.last_page ?? 1);
  for (let p = 2; p <= lastPage && p <= maxPages; p++) {
    const d = await ebGet(cfg, `/api/replies?status=interested&page=${p}`).catch(() => null);
    if (d?.data?.length) yield d.data;
  }
}

// "venaflare.com" -> "Venaflare": a tidy company-name fallback when the lead has
// no company set (common for GTMx leads). Twenty's native enrichment refines it.
function prettifyDomain(domain) {
  const core = String(domain || '').split('.')[0];
  return core ? core.charAt(0).toUpperCase() + core.slice(1) : '';
}

// Build the Twenty-facing fields from a reply + its lead. Reuses the dashboard's
// normalizer (which handles custom-var industry, email-domain, name fallbacks),
// then keeps the FULL reply body for the note (normalizer only keeps a snippet).
function buildFields(reply, lead) {
  const n = normalizeInterestedReply({ ...reply, lead: lead ?? reply?.lead ?? {} }, {
    id: reply?.campaign_id,
    name: '',
  });
  const company = (n.company && n.company.trim()) || prettifyDomain(n.emailDomain);
  // REST replies use `subject`; webhook inline replies use `email_subject`.
  const subject = n.subject || reply?.email_subject || '';
  const fullBody = reply?.text_body || n.snippet || '';
  return { ...n, company, subject, fullBody };
}

function buildNoteMarkdown(fields) {
  const parts = [String(fields.fullBody || '').trim() || '_(no reply body)_'];
  const meta = [];
  if (fields.dateReceived) meta.push(`Received: ${String(fields.dateReceived).slice(0, 10)}`);
  if (fields.company) meta.push(`Company: ${fields.company}`);
  if (fields.industry) meta.push(`Industry: ${fields.industry}`);
  meta.push('Source: EmailBison — Interested');
  parts.push(`\n---\n${meta.join(' · ')}`);
  return parts.join('\n');
}

async function getLedgerRow(sql, workspaceId, replyId) {
  return queryOne(
    sql,
    `SELECT * FROM ${LEDGER_TABLE} WHERE workspace_id = $1 AND reply_id = $2`,
    [workspaceId, replyId]
  );
}

// Upsert the provided columns only (others are left intact on conflict), so the
// step-by-step write-backs in pushReplyToTwenty stay resumable.
async function writeLedger(sql, row) {
  const data = { ...row, updated_at: new Date().toISOString() };
  const cols = Object.keys(data).filter((k) => data[k] !== undefined);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const updates = cols
    .filter((c) => c !== 'workspace_id' && c !== 'reply_id')
    .map((c) => `${c} = EXCLUDED.${c}`);
  const text =
    `INSERT INTO ${LEDGER_TABLE} (${cols.join(',')}) VALUES (${placeholders.join(',')}) ` +
    `ON CONFLICT (workspace_id, reply_id) DO UPDATE SET ${updates.join(', ')}`;
  await sql.query(text, cols.map((c) => data[c]));
}

/**
 * Push one interested reply into Twenty. `reply` must include text_body/subject;
 * `lead` is the full lead record (fetched by caller). Idempotent + resumable:
 * each CRM id is written back to the ledger as soon as it's obtained, so a crash
 * mid-way resumes exactly where it stopped. Never throws for a single reply — on
 * error it records the message on the ledger row and returns status 'error'.
 */
export async function pushReplyToTwenty({ reply, lead }, { cfg, log = () => {}, dryRun = false } = {}) {
  const workspaceId = cfg.workspaceId;
  const replyId = reply?.id;
  if (replyId == null) return { status: 'skipped', reason: 'no reply id' };

  const fields = buildFields(reply, lead);
  const leadId = reply?.lead_id ?? lead?.id ?? null;

  if (dryRun) {
    log(
      `DRY reply ${replyId}: company="${fields.company || fields.emailDomain}" ` +
        `person="${fields.fullName}" <${fields.email}> title="${fields.title}" ` +
        `note="${fields.subject}" (${(fields.fullBody || '').length} chars)`
    );
    return { status: 'dry' };
  }

  const sql = getSql();
  const existing = (await getLedgerRow(sql, workspaceId, replyId)) ?? {};
  if (existing.crm_note_id) return { status: 'skipped', reason: 'already pushed' };

  const base = { workspace_id: workspaceId, reply_id: replyId, lead_id: leadId, email: fields.email || null };

  try {
    // 1) Company
    let companyId = existing.crm_company_id ?? null;
    if (!companyId) {
      companyId = await upsertCompany({ name: fields.company, domain: fields.emailDomain });
      if (companyId) await writeLedger(sql, { ...base, ...existing, crm_company_id: companyId });
    }

    // 2) Person
    let personId = existing.crm_person_id ?? null;
    if (!personId) {
      personId = await upsertPerson({
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        jobTitle: fields.title,
        companyId,
      });
      if (personId) await writeLedger(sql, { ...base, crm_company_id: companyId, crm_person_id: personId });
    }

    // 3) Note (write back id immediately — this is what marks the reply "done")
    const noteId = await createReplyNote({ title: fields.subject, markdown: buildNoteMarkdown(fields) });
    await writeLedger(sql, {
      ...base,
      crm_company_id: companyId,
      crm_person_id: personId,
      crm_note_id: noteId,
      pushed_at: new Date().toISOString(),
      error: null,
    });

    // 4) Link note to person + company (self-dedupes)
    await linkNote(noteId, { personId, companyId });

    log(`reply ${replyId}: pushed (company=${companyId} person=${personId} note=${noteId})`);
    return { status: 'pushed', companyId, personId, noteId };
  } catch (err) {
    await writeLedger(sql, { ...base, ...existing, error: String(err?.message || err).slice(0, 500) }).catch(() => {});
    log(`reply ${replyId}: ERROR ${err?.message}`);
    return { status: 'error', error: err?.message };
  }
}

/**
 * Reconcile: page all interested replies in the GTMx workspace and push any not
 * yet in the ledger (crm_note_id null). Fetches each lead for full contact data.
 * Used by the cron for backfill + catching missed webhooks.
 */
export async function reconcileInterestedReplies({ log = () => {}, dryRun = false } = {}) {
  const cfg = getGtmxConfig();
  if (!cfg) { log('crm push skipped: EMAILBISON_GTMX_API_KEY not set'); return { skipped: true }; }
  if (!dryRun && !isConfigured()) { log('crm push skipped: TWENTY_API_KEY not set'); return { skipped: true }; }

  const counts = { seen: 0, pushed: 0, skipped: 0, error: 0, dry: 0 };
  for await (const page of iterateInterestedReplies(cfg)) {
    for (const reply of page) {
      counts.seen++;
      // Always fetch the full lead — the reply's nested lead is minimal (no
      // company / custom_variables), which we need for company name + industry.
      let lead = reply?.lead ?? null;
      const leadId = reply?.lead_id ?? lead?.id;
      if (leadId) {
        const full = await getLead(cfg, leadId).catch(() => null);
        if (full) lead = full;
      }
      const res = await pushReplyToTwenty({ reply, lead }, { cfg, log, dryRun });
      counts[res.status] = (counts[res.status] ?? 0) + 1;
    }
  }
  log(`crm reconcile done: ${JSON.stringify(counts)}`);
  return counts;
}
