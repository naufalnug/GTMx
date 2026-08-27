import { createAdminClient } from './supabase/adminCore.js';
import { loadNotificationBaseline, buildNotifications, emitNotifications } from './notifications.js';
import { normalizeInterestedReply } from './emailbison.js';
import { getClientApiConfig, listClientSlugs } from './clients.js';
import { getAdminConfig, withWorkspace } from './emailbisonAdmin.js';

// A sync is treated as abandoned after this long, so a crashed run cannot lock a
// client out permanently. Comfortably longer than the 800s function ceiling.
const SYNC_LOCK_STALE_MS = 20 * 60 * 1000;

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000; // abort a stalled request instead of hanging forever
const LEADS_MAX_PAGES = 5000; // safety stop
const HISTORY_START = '2020-01-01'; // wide window, used only for a first-ever backfill
// Past daily rows never change, so after the first sync we only re-pull a recent
// window. Re-fetching an overlap margin means late-arriving data is still caught.
const INCREMENTAL_OVERLAP_DAYS = 14;
// Deliberately 1. Raising this to 4 caused uksalesincrease to go from 150s to a
// hard 800s timeout: EmailBison throttles, and a burst stalls a connection with
// no response rather than erroring, which is the same silent-hang failure that
// broke this sync before. Do not raise without measuring one client at a time.
const CAMPAIGN_CONCURRENCY = 1;
// A `draft` campaign has never sent, so it has no daily stats and no replies —
// but it DOES have sequence steps, which the dashboard shows, so it is not
// skipped outright, only spared the two calls that can only return empty.
const NO_TRAFFIC_STATUSES = new Set(['draft']);

/** Runs fn over items with a bounded number in flight, preserving order. */
async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
}

async function supabaseUpsert(client, table, rows, conflict) {
  if (!rows.length) return 0;
  for (let index = 0; index < rows.length; index += 500) {
    const { error } = await client.from(table).upsert(rows.slice(index, index + 500), { onConflict: conflict.join(',') });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  return rows.length;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ebFetch(base, key, path) {
  const url = `${base}${path}`;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await sleep(400 * attempt);
    }
  }
  throw new Error(`EmailBison ${path} failed after ${MAX_RETRIES} tries: ${lastErr?.message}`);
}

function extractEmailDomain(email) {
  if (!email || typeof email !== 'string') return '';
  const at = email.lastIndexOf('@');
  if (at < 0) return '';
  return email.slice(at + 1).trim().toLowerCase();
}

// Short label for the EmailBison instance a client's data came from. IDs are
// only unique within an instance, so this discriminates rows in shared tables.
function sourceFromUrl(baseUrl) {
  let host = '';
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    host = String(baseUrl);
  }
  if (host.includes('send.gtmx.run')) return 'gtmx';
  if (host.includes('dedi.emailbison.com')) return 'dedi';
  return host || 'unknown';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// All campaigns (every status), paged 100 at a time.
async function listAllCampaigns(base, key) {
  const results = [];
  let page = 1;
  while (true) {
    const data = await ebFetch(base, key, `/api/campaigns?per_page=100&page=${page}`);
    const items = data?.data ?? data?.campaigns ?? [];
    results.push(...items);
    const meta = data?.meta;
    const hasMore = meta?.current_page < meta?.last_page;
    if (!items.length || !hasMore) break;
    page++;
    if (page > 50) break;
  }
  return results;
}

const SERIES_LABEL_TO_KEY = { Sent: 'sent', Replied: 'replies', Bounced: 'bounced' };

// Per-date {sent, replies, bounced} rows from the line-area chart series.
async function getCampaignDailyRows(base, key, campaignId, startDate = HISTORY_START) {
  const data = await ebFetch(
    base,
    key,
    `/api/campaigns/${campaignId}/line-area-chart-stats?start_date=${startDate}&end_date=${today()}`
  );
  const byDate = new Map();
  for (const series of data?.data ?? []) {
    const k = SERIES_LABEL_TO_KEY[series?.label];
    if (!k) continue;
    for (const point of series?.dates ?? []) {
      const date = point?.[0];
      if (!date) continue;
      let row = byDate.get(date);
      if (!row) {
        row = { date, sent: 0, replies: 0, bounced: 0 };
        byDate.set(date, row);
      }
      row[k] += Number(point?.[1] ?? 0);
    }
  }
  return [...byDate.values()];
}

async function getSequenceSteps(base, key, id) {
  const data = await ebFetch(base, key, `/api/campaigns/v1.1/${id}/sequence-steps`);
  return data?.data?.sequence_steps ?? [];
}

async function getInterestedReplies(base, key, campaignId) {
  const first = await ebFetch(base, key, `/api/replies?campaign_id=${campaignId}&page=1`);
  const lastPage = Number(first?.meta?.last_page ?? 1);
  const collected = (first?.data ?? []).filter((r) => r?.interested === true);
  for (let p = 2; p <= lastPage; p++) {
    const d = await ebFetch(base, key, `/api/replies?campaign_id=${campaignId}&page=${p}`).catch(
      () => null
    );
    if (d?.data) collected.push(...d.data.filter((r) => r?.interested === true));
  }
  return collected;
}

const LEADS_FILTER =
  'filters[emails_sent][criteria]=>=&filters[emails_sent][value]=1&per_page=100';

// EmailBison supports filtering leads by updated_at (verified: a future date
// returns zero rows, so it is honoured rather than ignored). A lead's updated_at
// moves whenever its stats change, so an incremental walk still catches existing
// leads that were emailed, opened or replied since the last sync — it is not
// limited to newly created ones, and nothing goes stale.
function leadsQuery(since) {
  return since
    ? `${LEADS_FILTER}&filters[updated_at][criteria]=>=&filters[updated_at][value]=${since}`
    : LEADS_FILTER;
}
const OFFSET_CAP_PAGES = 950; // EmailBison 422s past page 1000; stay clear

// Iterates contacted leads (emails_sent >= 1). EmailBison instances differ:
// send.gtmx.run supports cursor pagination (meta.next_cursor, no depth limit),
// while dedi.emailbison.com only does Laravel offset pagination capped at page
// 1000 (~15k rows) with no cursor. We probe the style, then for the capped
// offset case walk older created_at<= windows to exceed 15k (boundary overlap
// is deduped by the upsert PK). Yields batches of raw leads.
async function* iterateContacts(base, key, since = null, startCursor = null) {
  const filter = leadsQuery(since);
  const probe = await ebFetch(base, key, `/api/leads?${filter}&pagination_type=cursor`);
  const useCursor = Boolean(probe?.meta?.next_cursor) || Boolean(startCursor);

  if (useCursor) {
    // `cursor` is always the cursor for the NEXT page, so persisting it and passing
    // it back as startCursor resumes exactly where a timed-out run stopped.
    let cursor = startCursor;
    for (let i = 0; i < LEADS_MAX_PAGES; i++) {
      const qs = `${filter}&pagination_type=cursor${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const res = await ebFetch(base, key, `/api/leads?${qs}`);
      const batch = res?.data ?? [];
      cursor = batch.length ? res?.meta?.next_cursor ?? null : null;
      if (batch.length) yield { batch, cursor };
      if (!cursor) break;
    }
    return;
  }

  // Offset + created_at<= keyset windowing.
  let boundary = null;
  for (let window = 0; window < 200; window++) {
    let minDate = null;
    let lastPage = 1;
    let page = 1;
    let sawAny = false;
    for (; page <= OFFSET_CAP_PAGES; page++) {
      const dateFilter = boundary
        ? `&filters[created_at][criteria]=<=&filters[created_at][value]=${boundary}`
        : '';
      const res = await ebFetch(base, key, `/api/leads?${filter}${dateFilter}&page=${page}`);
      const batch = res?.data ?? [];
      lastPage = Number(res?.meta?.last_page ?? 1);
      if (!batch.length) return;
      sawAny = true;
      // Offset paging has no resumable cursor; only the retired dedi instance uses it.
      yield { batch, cursor: null };
      for (const l of batch) {
        const d = String(l?.created_at ?? '').slice(0, 10);
        if (d && (!minDate || d < minDate)) minDate = d;
      }
      if (page >= lastPage) break;
    }
    if (lastPage <= OFFSET_CAP_PAGES) return; // everything <= boundary fetched
    if (!sawAny || !minDate || minDate === boundary) return; // can't progress
    boundary = minDate; // walk into older leads
  }
}

/**
 * Pulls a single client's outreach data from EmailBison and upserts it into
 * Supabase: campaigns, daily stats, sequence steps, interested replies, and
 * contacted leads. Idempotent — safe to re-run.
 */
export async function syncClient(cfg, opts = {}) {
  const { log = () => {} } = opts;
  const { slug, baseUrl, apiKey } = cfg;
  const db = createAdminClient();
  const source = sourceFromUrl(baseUrl);

  const campaigns = await listAllCampaigns(baseUrl, apiKey);

  // Everything below decides how MUCH work each campaign needs, not whether it
  // appears on the dashboard — campaignRows is still built from every campaign.
  //
  // Before this, every run re-pulled all daily history back to 2020 for every
  // campaign of every status. One 3-campaign client produced 7,293 daily rows and
  // took 369s, so no run ever fitted inside the function timeout.
  const [{ data: knownCampaigns }, { data: clientRow }] = await Promise.all([
    db.from('campaigns').select('campaign_id').eq('client', slug).eq('source', source),
    db.from('clients').select('last_synced_at, contacts_cursor').eq('slug', slug).maybeSingle(),
  ]);
  const known = new Set((knownCampaigns ?? []).map((r) => Number(r.campaign_id)));
  const lastSynced = clientRow?.last_synced_at ?? null;
  // A full backfill that ran out of time leaves a cursor behind; resume from it.
  const resumeCursor = lastSynced ? null : clientRow?.contacts_cursor ?? null;
  // A client that has never completed a sync gets the full backfill.
  const windowStart = lastSynced
    ? new Date(Math.min(Date.parse(lastSynced), Date.now()) - INCREMENTAL_OVERLAP_DAYS * 86_400_000)
        .toISOString()
        .slice(0, 10)
    : HISTORY_START;

  const noTraffic = campaigns.filter((c) => NO_TRAFFIC_STATUSES.has(String(c.status ?? ''))).length;
  log(
    `${slug}: ${campaigns.length} campaigns (source=${source}); ` +
      `${noTraffic} draft (steps only), daily window from ${windowStart}` +
      (lastSynced ? '' : ' (first full backfill)')
  );

  const dailyRows = [];
  const stepRows = [];
  const replyRows = [];
  const interestedCount = new Map();

  const perCampaign = await mapWithConcurrency(campaigns, CAMPAIGN_CONCURRENCY, async (c) => {
    // A campaign we have never stored has no history in Supabase yet, so it needs
    // the full window even on an incremental run.
    const from = known.has(Number(c.id)) ? windowStart : HISTORY_START;
    const quiet = NO_TRAFFIC_STATUSES.has(String(c.status ?? ''));
    const [steps, daily, interested] = await Promise.all([
      getSequenceSteps(baseUrl, apiKey, c.id).catch(() => []),
      quiet ? [] : getCampaignDailyRows(baseUrl, apiKey, c.id, from).catch(() => []),
      quiet ? [] : getInterestedReplies(baseUrl, apiKey, c.id).catch(() => []),
    ]);
    return { c, steps, daily, interested };
  });

  for (const { c, steps, daily, interested } of perCampaign) {
    for (const s of steps) {
      stepRows.push({
        client: slug,
        source,
        campaign_id: c.id,
        step_id: s.id,
        step_order: Number(s.order ?? 0),
        subject: s.email_subject ?? null,
        body: s.email_body ?? null,
        wait_in_days: Number(s.wait_in_days ?? 0),
        thread_reply: Boolean(s.thread_reply),
      });
    }
    for (const d of daily) dailyRows.push({ client: slug, source, campaign_id: c.id, ...d });

    interestedCount.set(c.id, interested.length);
    for (const r of interested) {
      const n = normalizeInterestedReply(r, { id: c.id, name: c.name });
      if (n.id == null) continue;
      replyRows.push({
        client: slug,
        source,
        reply_id: n.id,
        campaign_id: n.campaignId ?? null,
        campaign_name: n.campaignName ?? null,
        date_received: n.dateReceived ?? null,
        first_name: n.firstName ?? null,
        last_name: n.lastName ?? null,
        full_name: n.fullName ?? null,
        title: n.title ?? null,
        company: n.company ?? null,
        industry: n.industry ?? null,
        email: n.email ?? null,
        email_domain: n.emailDomain ?? null,
        subject: n.subject ?? null,
        snippet: n.snippet ?? null,
      });
    }
  }

  const campaignRows = campaigns.map((c) => ({
    client: slug,
    campaign_id: c.id,
    source,
    name: c.name ?? null,
    status: c.status ?? null,
    type: c.type ?? null,
    total_leads: Number(c.total_leads ?? 0),
    contacts: Number(c.total_leads_contacted ?? 0),
    sent: Number(c.emails_sent ?? 0),
    replies: Number(c.unique_replies ?? c.replied ?? 0),
    bounced: Number(c.bounced ?? 0),
    interested: interestedCount.get(c.id) ?? 0,
    completion: Number(c.completion_percentage ?? 0),
    updated_at: new Date().toISOString(),
  }));

  // Snapshot BEFORE the upsert: it overwrites prior values with no history, and
  // campaigns.updated_at is stamped now() unconditionally below, so this is the only
  // moment both old and new state exist.
  const notificationBaseline = await loadNotificationBaseline(db, slug, source).catch((error) => {
    console.error(`[notifications] ${slug}/${source}: baseline failed — ${error.message}`);
    return null;
  });

  await supabaseUpsert(db, 'campaigns', campaignRows, ['client', 'source', 'campaign_id']);
  await supabaseUpsert(db, 'campaign_daily_stats', dailyRows, ['client', 'source', 'campaign_id', 'date']);
  await supabaseUpsert(db, 'sequence_steps', stepRows, ['client', 'source', 'campaign_id', 'step_id']);
  await supabaseUpsert(db, 'interested_replies', replyRows, ['client', 'source', 'reply_id']);

  // Notifications are a read-side nicety. They must never fail a sync or stop
  // last_synced_at from advancing, so everything here is swallowed.
  if (notificationBaseline) {
    try {
      const created = await emitNotifications(
        db,
        buildNotifications(notificationBaseline, { slug, source, campaignRows, replyRows })
      );
      if (created) log(`${slug}: ${created} notification event(s)`);
    } catch (error) {
      console.error(`[notifications] ${slug}/${source}: emit failed — ${error.message}`);
    }
  }
  log(
    `${slug}: upserted ${campaignRows.length} campaigns, ${dailyRows.length} daily rows, ` +
      `${stepRows.length} steps, ${replyRows.length} interested replies`
  );

  const interestedEmails = new Set(
    replyRows.map((r) => (r.email || '').toLowerCase()).filter(Boolean)
  );

  let contactCount = 0;
  const seenLeadIds = [];
  // Stop the lead walk before the function is killed, so the cursor can be saved.
  // Without this a big client restarts from zero every run and never finishes.
  const walkDeadline = opts.deadline ?? null;
  let lastCursor = resumeCursor;
  let walkComplete = true;
  if (resumeCursor) log(`${slug}: resuming contact backfill from saved cursor`);
  for await (const { batch, cursor } of iterateContacts(
    baseUrl,
    apiKey,
    lastSynced ? windowStart : null,
    resumeCursor
  )) {
    lastCursor = cursor;
    // Safety net: keep contacted leads only, even if an instance ignores the filter.
    const rows = batch
      .filter((lead) => Number(lead?.overall_stats?.emails_sent ?? 0) >= 1)
      .map((lead) => {
      const email = lead?.email ?? null;
      const stats = lead?.overall_stats ?? {};
      return {
        client: slug,
        source,
        lead_id: lead.id,
        email,
        first_name: lead.first_name ?? null,
        last_name: lead.last_name ?? null,
        title: lead.title ?? null,
        company: (lead.company ?? '').trim() || null,
        domain: extractEmailDomain(email) || null,
        status: lead.status ?? null,
        tags: lead.tags ?? null,
        emails_sent: Number(stats.emails_sent ?? 0),
        opens: Number(stats.unique_opens ?? stats.opens ?? 0),
        replies: Number(stats.unique_replies ?? stats.replies ?? 0),
        interested: email ? interestedEmails.has(email.toLowerCase()) : false,
        created_at: lead.created_at ?? null,
        updated_at: lead.updated_at ?? null,
      };
    });
    await supabaseUpsert(db, 'contacts', rows, ['client', 'source', 'lead_id']);
    for (const r of rows) seenLeadIds.push(r.lead_id);
    contactCount += rows.length;
    if (contactCount % 2000 < rows.length) log(`${slug}: ${contactCount} contacts…`);
    if (walkDeadline && Date.now() > walkDeadline && cursor) {
      walkComplete = false;
      log(`${slug}: out of time after ${contactCount} contacts — saving cursor to resume`);
      break;
    }
  }

  if (!walkComplete) {
    // Leave last_synced_at untouched so the next run stays in full-backfill mode
    // and picks up from here. Pruning is skipped: this pull is knowingly partial.
    await db.from('clients').update({ contacts_cursor: lastCursor }).eq('slug', slug);
    log(`${slug}: partial backfill saved (${contactCount} contacts this run)`);
    return {
      campaigns: campaignRows.length,
      dailyRows: dailyRows.length,
      steps: stepRows.length,
      interestedReplies: replyRows.length,
      contacts: contactCount,
      partial: true,
    };
  }
  await db.from('clients').update({ contacts_cursor: null }).eq('slug', slug);

  // Prune stale contacts: the upsert above never deletes, so without this the table
  // would accumulate the union of every past pull and inflate all company counts.
  //
  // ONLY on a completed full backfill. An incremental run deliberately sees just the
  // leads touched since the last sync, so "not seen in this pull" says nothing about
  // whether a row is stale — pruning on that basis would delete almost the entire
  // table. The 50% guard below would usually catch it, but relying on a heuristic to
  // prevent mass deletion is not good enough.
  //
  // Also never after a RESUMED backfill: seenLeadIds only holds the leads from the
  // final run, not the ones earlier runs already wrote, so pruning against it would
  // delete almost everything the backfill just spent several runs fetching.
  if (!lastSynced && !resumeCursor && seenLeadIds.length > 0) {
    const { count: existing = 0 } = await db.from('contacts').select('*', { count: 'exact', head: true }).eq('client', slug).eq('source', source);
    if (seenLeadIds.length >= Math.floor(existing * 0.5)) {
      const { data: removed, error } = await db.rpc('prune_portal_contacts', { target_client: slug, target_source: source, keep_ids: seenLeadIds });
      if (error) throw error;
      if (removed > 0) log(`${slug}: pruned ${removed} stale contacts (kept ${seenLeadIds.length})`);
    } else {
      log(`${slug}: skipped prune — pull ${seenLeadIds.length} < 50% of stored ${existing} (likely truncated)`);
    }
  } else if (lastSynced) {
    log(`${slug}: prune skipped (incremental run — only a full backfill can judge staleness)`);
  } else if (resumeCursor) {
    log(`${slug}: prune skipped (resumed backfill — this run saw only the final chunk)`);
  }

  await db.from('clients').update({ last_synced_at: new Date().toISOString(), sync_error: null }).eq('slug', slug);
  log(`${slug}: done — ${contactCount} contacts`);

  return {
    campaigns: campaignRows.length,
    dailyRows: dailyRows.length,
    steps: stepRows.length,
    interestedReplies: replyRows.length,
    contacts: contactCount,
  };
}

/**
 * Syncs the given client slugs (defaults to all registered clients). Clients
 * without API credentials configured are skipped, not fatal, and a client that
 * throws is recorded against `sync_error` without stopping the others — only an
 * all-clients failure propagates.
 *
 * `opts.deadline` (epoch ms) bounds the run: once passed, remaining clients are
 * reported as `deferred` rather than started. At least one client is always
 * attempted, so a run can never make zero progress.
 */
export async function runSync(slugs, opts = {}) {
  const targets = slugs && slugs.length ? slugs : listClientSlugs();
  const results = {};
  const failures = [];
  let attempted = 0;
  for (const slug of targets) {
    // A full roster takes many minutes, well past a serverless function's ceiling.
    // Stop before starting a client we can't finish so the invocation returns
    // cleanly with partial progress instead of being killed mid-write. Callers
    // pass the stalest clients first, so nothing starves across runs.
    if (opts.deadline && Date.now() > opts.deadline && attempted) {
      opts.log?.(`${slug}: deferred (out of time this run)`);
      results[slug] = { deferred: true };
      continue;
    }
    const cfg = getClientApiConfig(slug);
    if (!cfg) {
      opts.log?.(`${slug}: skipped (missing instance URL / API key)`);
      results[slug] = { skipped: true };
      continue;
    }

    // Take a per-client lock. Two concurrent syncs of the same client race on
    // contacts_cursor and can undo each other's progress; historically, overlapping
    // syncs across clients also corrupted contact tables via the shared API key.
    // The update only matches when the lock is free or stale, so it is atomic.
    const lockDb = createAdminClient();
    const staleBefore = new Date(Date.now() - SYNC_LOCK_STALE_MS).toISOString();
    const { data: lockRows } = await lockDb
      .from('clients')
      .update({ sync_lock_at: new Date().toISOString() })
      .eq('slug', slug)
      .or(`sync_lock_at.is.null,sync_lock_at.lt.${staleBefore}`)
      .select('slug');
    if (!lockRows?.length) {
      opts.log?.(`${slug}: skipped (another sync is already running)`);
      results[slug] = { locked: true };
      continue;
    }
    // Clients without a dedicated key (e.g. lookmedia) are read with the shared
    // admin key by switching into their child workspace for the duration of the
    // sync; withWorkspace always switches back to main afterwards.
    try {
      if (cfg.adminWorkspaceId) {
        const adminCfg = getAdminConfig();
        if (!adminCfg) {
          opts.log?.(`${slug}: skipped (no admin key for workspace ${cfg.adminWorkspaceId})`);
          results[slug] = { skipped: true };
          continue;
        }
        attempted += 1;
        results[slug] = await withWorkspace(adminCfg, cfg.adminWorkspaceId, () => syncClient(cfg, opts));
      } else {
        attempted += 1;
        results[slug] = await syncClient(cfg, opts);
      }
    } catch (error) {
      // Deliberately no notification here: sync failures are GTMx plumbing and must
      // never surface in a client's portal feed.
      // Record and carry on. Rethrowing used to abandon every client after this
      // one in the loop, so a single broken client silently starved the rest of
      // the roster on every scheduled run.
      await createAdminClient().from('clients').update({ sync_error: error.message, updated_at: new Date().toISOString() }).eq('slug', slug);
      opts.log?.(`${slug}: FAILED — ${error.message}`);
      results[slug] = { failed: true, error: error.message };
      failures.push(slug);
    } finally {
      // Always release, including on failure — otherwise one crash would block the
      // client for the full 20-minute stale window.
      await lockDb.from('clients').update({ sync_lock_at: null }).eq('slug', slug);
    }
  }
  if (failures.length === targets.length && failures.length) {
    // Every target failed: surface it so the caller (cron route / button) reports
    // an error instead of a success with nothing synced.
    throw new Error(`sync failed for every client: ${failures.join(', ')}`);
  }
  return results;
}
