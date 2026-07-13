import { reconcileEnrichment } from '../../../../lib/enrich';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Enriches pipeline leads with LinkedIn + mobile phone via BetterEnrich and
 * writes them onto the Twenty contacts. Scheduled hourly (see vercel.json) as
 * the automation path; the first run backfills the existing pipeline.
 *
 * Auth: Vercel cron sends `Authorization: Bearer <CRON_SECRET>`. A manual
 * trigger may instead pass `?token=<EMAILBISON_WEBHOOK_SECRET>` (used for the
 * one-off backfill without the CRON_SECRET on hand).
 */
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const webhookSecret = process.env.EMAILBISON_WEBHOOK_SECRET;
  const auth = request.headers.get('authorization');
  const token = new URL(request.url).searchParams.get('token');
  const ok =
    (cronSecret && auth === `Bearer ${cronSecret}`) ||
    (webhookSecret && token === webhookSecret);
  if ((cronSecret || webhookSecret) && !ok) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const counts = await reconcileEnrichment({ log: (m) => console.log(m) });
    return Response.json({ ok: true, counts });
  } catch (err) {
    console.error('CRM enrich failed', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
