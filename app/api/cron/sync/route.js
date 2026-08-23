import { runSync } from '../../../../lib/sync';
import { listClientSlugs } from '../../../../lib/clients';
import { createAdminClient } from '../../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Leave room inside maxDuration to finish the client in flight and write results.
// A full roster takes minutes, so an unbounded run gets killed mid-write.
const TIME_BUDGET_MS = 210_000;

/**
 * Orders clients stalest-first so a run that can't reach everyone still makes
 * even progress across the roster over successive runs. Clients never synced
 * (null last_synced_at) go first.
 */
async function stalestFirst(slugs) {
  try {
    const { data } = await createAdminClient().from('clients').select('slug, last_synced_at');
    const seen = new Map((data ?? []).map((row) => [row.slug, row.last_synced_at]));
    return [...slugs].sort((a, b) => {
      const left = seen.get(a) ? new Date(seen.get(a)).getTime() : 0;
      const right = seen.get(b) ? new Date(seen.get(b)).getTime() : 0;
      return left - right;
    });
  } catch {
    return slugs;
  }
}

/**
 * Refreshes Supabase from EmailBison. Invoked by the Vercel cron (see vercel.json)
 * and by the n8n backup schedule, which fans out one request per client so no
 * single invocation has to carry the whole roster.
 *
 * `?client=<slug>` syncs just that client. Vercel attaches
 * `Authorization: Bearer <CRON_SECRET>` automatically when CRON_SECRET is set.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  const params = new URL(request.url).searchParams;
  // Discovery for the n8n backup schedule: it fans out one request per client, so
  // it needs the roster. Returning it here means adding a client to lib/clients.js
  // is enough — the schedule picks it up without being edited.
  if (params.get('list')) {
    return Response.json({ ok: true, clients: listClientSlugs() });
  }
  const requested = params.get('client');
  if (requested && !listClientSlugs().includes(requested)) {
    return Response.json({ ok: false, error: `unknown client: ${requested}` }, { status: 404 });
  }
  const targets = requested ? [requested] : await stalestFirst(listClientSlugs());
  try {
    const results = await runSync(targets, {
      deadline: Date.now() + TIME_BUDGET_MS,
      log: (m) => console.log(m),
    });
    const deferred = Object.entries(results).filter(([, r]) => r?.deferred).map(([s]) => s);
    return Response.json({ ok: true, order: targets, deferred, results });
  } catch (err) {
    console.error('Cron sync failed', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
