// BetterEnrich enrichment pass for the Twenty CRM pipeline.
//
// Waterfalls each pipeline lead's email -> LinkedIn URL -> mobile phone, and
// writes both onto the Twenty contact. Runs as a scheduled cron
// (app/api/cron/enrich) decoupled from the real-time webhook. Idempotent via the
// crm_pushed_replies ledger: a row with enriched_at set is never re-enriched, so
// credits are spent once per lead (even for not-found).

import { getSql } from './db.js';
import * as be from './betterenrich.js';
import { updatePersonContact, isConfigured as twentyConfigured } from './twenty.js';

const TABLE = 'crm_pushed_replies';

let _ready = false;
async function ensureEnrichSchema(sql) {
  if (_ready) return;
  for (const col of ['enriched_at timestamptz', 'linkedin_url text', 'mobile_phone text', 'enrich_status text']) {
    await sql.query(`ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS ${col}`);
  }
  _ready = true;
}

/**
 * Enrich one contact: email -> LinkedIn (unless already known) -> mobile phone,
 * then PATCH the Twenty person. Returns { linkedin, phone, status } where status
 * is 'enriched' (phone found), 'linkedin_only', or 'not_found'.
 */
export async function enrichContact({ personId, email, existingLinkedin } = {}) {
  let linkedin = existingLinkedin || null;
  if (!linkedin && email) {
    const r = await be.findLinkedInByEmail(email);
    linkedin = r.url;
  }
  let phone = null;
  if (linkedin) phone = await be.findMobilePhone(linkedin);
  if ((linkedin || phone) && personId) {
    await updatePersonContact(personId, { linkedinUrl: linkedin, phone });
  }
  const status = phone ? 'enriched' : linkedin ? 'linkedin_only' : 'not_found';
  return { linkedin, phone, status };
}

// Bounded-concurrency pool with cooperative early-abort (on credit exhaustion).
async function pool(items, n, fn) {
  let i = 0;
  let aborted = false;
  async function worker() {
    while (i < items.length && !aborted) {
      const item = items[i++];
      try {
        await fn(item);
      } catch (err) {
        if (err?.abort) aborted = true;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
}

/**
 * Enrich pipeline leads not yet enriched. Reads the ledger, waterfalls each
 * concurrently, writes to Twenty, marks enriched_at (+ status). The first run is
 * the backfill; subsequent runs pick up newly-pushed leads.
 */
export async function reconcileEnrichment({ log = () => {}, limit = 60, concurrency = 10 } = {}) {
  if (!be.isConfigured()) { log('enrich skipped: BETTERENRICH_API_KEY not set'); return { skipped: true }; }
  if (!twentyConfigured()) { log('enrich skipped: TWENTY_API_KEY not set'); return { skipped: true }; }

  const sql = getSql();
  await ensureEnrichSchema(sql);
  const rows = await sql.query(
    `SELECT workspace_id, reply_id, email, crm_person_id, linkedin_url
       FROM ${TABLE}
      WHERE crm_person_id IS NOT NULL AND enriched_at IS NULL
      ORDER BY updated_at
      LIMIT ${Number(limit)}`
  );
  const creditsBefore = await be.getCredits();
  const counts = { seen: rows.length, enriched: 0, linkedin_only: 0, not_found: 0, error: 0 };

  await pool(rows, concurrency, async (r) => {
    try {
      const res = await enrichContact({ personId: r.crm_person_id, email: r.email, existingLinkedin: r.linkedin_url });
      await sql.query(
        `UPDATE ${TABLE} SET linkedin_url=$1, mobile_phone=$2, enrich_status=$3, enriched_at=now(), updated_at=now()
          WHERE workspace_id=$4 AND reply_id=$5`,
        [res.linkedin, res.phone, res.status, r.workspace_id, r.reply_id]
      );
      counts[res.status] = (counts[res.status] ?? 0) + 1;
      log(`reply ${r.reply_id}: ${res.status}${res.phone ? ' ' + res.phone : ''}`);
    } catch (err) {
      counts.error++;
      log(`reply ${r.reply_id}: ERROR ${err?.message}`);
      if (err?.credits) throw Object.assign(err, { abort: true }); // stop on credit exhaustion
    }
  });

  const creditsAfter = await be.getCredits();
  log(`enrich done: ${JSON.stringify(counts)} | credits ${creditsBefore} -> ${creditsAfter}`);
  return { ...counts, creditsBefore, creditsAfter };
}
