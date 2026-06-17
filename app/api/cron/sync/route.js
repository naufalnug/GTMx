import { runSync } from '../../../../lib/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Refreshes Supabase from EmailBison for all configured clients. Invoked by the
 * Vercel cron (see vercel.json). Vercel attaches `Authorization: Bearer
 * <CRON_SECRET>` automatically when CRON_SECRET is set; we reject anything else.
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
    const results = await runSync([], { log: (m) => console.log(m) });
    return Response.json({ ok: true, results });
  } catch (err) {
    console.error('Cron sync failed', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
