import { createAdminClient } from './supabase/adminCore.js';
import { normalizeInterestedReply } from './emailbison.js';
import { getClientApiConfig, listClientSlugs } from './clients.js';
import { getAdminConfig, withWorkspace } from './emailbisonAdmin.js';

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000; // abort a stalled request instead of hanging forever
const LEADS_MAX_PAGES = 5000; // safety stop
const HISTORY_START = '2020-01-01'; // wide window for full daily history

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
async function getCampaignDailyRows(base, key, campaignId) {
  const data = await ebFetch(
    base,
    key,
    `/api/campaigns/${campaignId}/line-area-chart-stats?start_date=${HISTORY_START}&end_date=${today()}`
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
const OFFSET_CAP_PAGES = 950; // EmailBison 422s past page 1000; stay clear

// Iterates contacted leads (emails_sent >= 1). EmailBison instances differ:
// send.gtmx.run supports cursor pagination (meta.next_cursor, no depth limit),
// while dedi.emailbison.com only does Laravel offset pagination capped at page
// 1000 (~15k rows) with no cursor. We probe the style, then for the capped
// offset case walk older created_at<= windows to exceed 15k (boundary overlap
// is deduped by the upsert PK). Yields batches of raw leads.
async function* iterateContacts(base, key) {
  const probe = await ebFetch(base, key, `/api/leads?${LEADS_FILTER}&pagination_type=cursor`);
  const useCursor = Boolean(probe?.meta?.next_cursor);

  if (useCursor) {
    let cursor = null;
    for (let i = 0; i < LEADS_MAX_PAGES; i++) {
      const qs = `${LEADS_FILTER}&pagination_type=cursor${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const res = await ebFetch(base, key, `/api/leads?${qs}`);
      const batch = res?.data ?? [];
      if (batch.length) yield batch;
      cursor = batch.length ? res?.meta?.next_cursor ?? null : null;
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
      const res = await ebFetch(base, key, `/api/leads?${LEADS_FILTER}${dateFilter}&page=${page}`);
      const batch = res?.data ?? [];
      lastPage = Number(res?.meta?.last_page ?? 1);
      if (!batch.length) return;
      sawAny = true;
      yield batch;
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
export async function syncClient(cfg, { log = () => {} } = {}) {
  const { slug, baseUrl, apiKey } = cfg;
  const db = createAdminClient();
  const source = sourceFromUrl(baseUrl);

  const campaigns = await listAllCampaigns(baseUrl, apiKey);
  log(`${slug}: ${campaigns.length} campaigns (source=${source})`);

  const dailyRows = [];
  const stepRows = [];
  const replyRows = [];
  const interestedCount = new Map();

  for (const c of campaigns) {
    const [steps, daily, interested] = await Promise.all([
      getSequenceSteps(baseUrl, apiKey, c.id).catch(() => []),
      getCampaignDailyRows(baseUrl, apiKey, c.id).catch(() => []),
      getInterestedReplies(baseUrl, apiKey, c.id).catch(() => []),
    ]);

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

  await supabaseUpsert(db, 'campaigns', campaignRows, ['client', 'source', 'campaign_id']);
  await supabaseUpsert(db, 'campaign_daily_stats', dailyRows, ['client', 'source', 'campaign_id', 'date']);
  await supabaseUpsert(db, 'sequence_steps', stepRows, ['client', 'source', 'campaign_id', 'step_id']);
  await supabaseUpsert(db, 'interested_replies', replyRows, ['client', 'source', 'reply_id']);
  log(
    `${slug}: upserted ${campaignRows.length} campaigns, ${dailyRows.length} daily rows, ` +
      `${stepRows.length} steps, ${replyRows.length} interested replies`
  );

  const interestedEmails = new Set(
    replyRows.map((r) => (r.email || '').toLowerCase()).filter(Boolean)
  );

  let contactCount = 0;
  const seenLeadIds = [];
  for await (const batch of iterateContacts(baseUrl, apiKey)) {
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
  }

  // Prune stale contacts: the upsert above never deletes, and the /api/leads
  // cursor returns a shifting subset per run, so without this the table would
  // accumulate the union of every past pull and inflate all company counts.
  // Delete rows not seen in this pull — but only when the pull looks complete
  // (>= half of what's already stored), so a truncated pull can't wipe the table.
  if (seenLeadIds.length > 0) {
    const { count: existing = 0 } = await db.from('contacts').select('*', { count: 'exact', head: true }).eq('client', slug).eq('source', source);
    if (seenLeadIds.length >= Math.floor(existing * 0.5)) {
      const { data: removed, error } = await db.rpc('prune_portal_contacts', { target_client: slug, target_source: source, keep_ids: seenLeadIds });
      if (error) throw error;
      if (removed > 0) log(`${slug}: pruned ${removed} stale contacts (kept ${seenLeadIds.length})`);
    } else {
      log(`${slug}: skipped prune — pull ${seenLeadIds.length} < 50% of stored ${existing} (likely truncated)`);
    }
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
 * without API credentials configured are skipped, not fatal.
 */
export async function runSync(slugs, opts = {}) {
  const targets = slugs && slugs.length ? slugs : listClientSlugs();
  const results = {};
  for (const slug of targets) {
    const cfg = getClientApiConfig(slug);
    if (!cfg) {
      opts.log?.(`${slug}: skipped (missing instance URL / API key)`);
      results[slug] = { skipped: true };
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
        results[slug] = await withWorkspace(adminCfg, cfg.adminWorkspaceId, () => syncClient(cfg, opts));
      } else {
        results[slug] = await syncClient(cfg, opts);
      }
    } catch (error) {
      await createAdminClient().from('clients').update({ sync_error: error.message, updated_at: new Date().toISOString() }).eq('slug', slug);
      throw error;
    }
  }
  return results;
}
