import { getSupabase } from '../../../../lib/supabase';
import { reconcileInterestedReplies } from '../../../../lib/crmPush';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Reconciles Twenty CRM with the GTMx EmailBison workspace: pushes any
 * "interested" reply not yet recorded in the crm_pushed_replies ledger into
 * Twenty (Company + Contact + Note). Runs hourly (see vercel.json) as the
 * reliable path — it does the initial backfill and re-catches any webhook
 * EmailBison failed to deliver. Idempotent. Gated by CRON_SECRET like /api/cron/sync.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  try {
    const sb = getSupabase();
    const counts = await reconcileInterestedReplies({ sb, log: (m) => console.log(m) });
    return Response.json({ ok: true, counts });
  } catch (err) {
    console.error('CRM sync failed', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
