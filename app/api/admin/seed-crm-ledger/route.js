import { getSql } from '../../../../lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * One-time bootstrap for the EmailBison -> Twenty CRM ledger on Neon: creates the
 * crm_pushed_replies table and seeds the rows backfilled earlier (posted in the
 * body), so the reconcile/webhook don't re-create duplicate notes for replies
 * already in Twenty. Idempotent (ON CONFLICT DO NOTHING). Gated by the webhook
 * secret. Safe to remove after the ledger is seeded.
 *
 *   POST /api/admin/seed-crm-ledger?token=<EMAILBISON_WEBHOOK_SECRET>
 *   body: { "rows": [ { workspace_id, reply_id, lead_id, email,
 *                       crm_company_id, crm_person_id, crm_note_id, pushed_at }, ... ] }
 */
export async function POST(request) {
  const secret = process.env.EMAILBISON_WEBHOOK_SECRET || process.env.CRON_SECRET;
  if (secret) {
    const token = new URL(request.url).searchParams.get('token');
    if (token !== secret) return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid JSON' }, { status: 400 });
  }
  const rows = Array.isArray(body?.rows) ? body.rows : [];

  try {
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

    const [{ total }] = await sql.query(`select count(*)::int as total from crm_pushed_replies`);
    return Response.json({ ok: true, received: rows.length, inserted, total });
  } catch (err) {
    console.error('seed-crm-ledger failed', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
