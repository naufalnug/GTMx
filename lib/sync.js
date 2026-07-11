import { getSql, bulkUpsert } from './db.js';
import { normalizeInterestedReply } from './emailbison.js';
import { getClientApiConfig, listClientSlugs } from './clients.js';

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000; // abort a stalled request instead of hanging forever
const LEADS_MAX_PAGES = 5000; // safety stop
const HISTORY_START = '2020-01-01'; // wide window for full daily history

// Column order for each upsert target (matches scripts/neon-schema.sql).
const COLUMNS = {
  campaigns: [
    'client', 'source', 'campaign_id', 'name', 'status', 'type', 'total_leads',
    'contacts', 'sent', 'replies', 'bounced', 'interested', 'completion', 'updated_at',
  ],
  campaign_daily_stats: ['client', 'source', 'campaign_id', 'date', 'sent', 'replies', 'bounced'],
  sequence_steps: [
    'client', 'source', 'campaign_id', 'step_id', 'step_order', 'subject', 'body',
    'wait_in_days', 'thread_reply',
  ],
  interested_replies: [
    'client', 'source', 'reply_id', 'campaign_id', 'campaign_name', 'date_received',
    'first_name', 'last_name', 'full_name', 'title', 'company', 'industry', 'email',
    'email_domain', 'subject', 'snippet',
  ],
  contacts: [
    'client', 'source', 'lead_id', 'email', 'first_name', 'last_name', 'title', 'company',
    'domain', 'status', 'tags', 'emails_sent', 'opens', 'replies', 'interested',
    'created_at', 'updated_at',
  ],
};

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
 * Neon: campaigns, daily stats, sequence steps, interested replies, and
 * contacted leads. Idempotent — safe to re-run.
 */
export async function syncClient(cfg, { log = () => {} } = {}) {
  const { slug, baseUrl, apiKey } = cfg;
  const sql = getSql();
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

  await bulkUpsert(sql, {
    table: 'campaigns', columns: COLUMNS.campaigns, rows: campaignRows,
    conflict: ['client', 'source', 'campaign_id'],
  });
  await bulkUpsert(sql, {
    table: 'campaign_daily_stats', columns: COLUMNS.campaign_daily_stats, rows: dailyRows,
    conflict: ['client', 'source', 'campaign_id', 'date'],
  });
  await bulkUpsert(sql, {
    table: 'sequence_steps', columns: COLUMNS.sequence_steps, rows: stepRows,
    conflict: ['client', 'source', 'campaign_id', 'step_id'],
  });
  await bulkUpsert(sql, {
    table: 'interested_replies', columns: COLUMNS.interested_replies, rows: replyRows,
    conflict: ['client', 'source', 'reply_id'],
  });
  log(
    `${slug}: upserted ${campaignRows.length} campaigns, ${dailyRows.length} daily rows, ` +
      `${stepRows.length} steps, ${replyRows.length} interested replies`
  );

  const interestedEmails = new Set(
    replyRows.map((r) => (r.email || '').toLowerCase()).filter(Boolean)
  );

  let contactCount = 0;
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
    await bulkUpsert(sql, {
      table: 'contacts', columns: COLUMNS.contacts, rows,
      conflict: ['client', 'source', 'lead_id'], casts: { tags: 'jsonb' },
    });
    contactCount += rows.length;
    if (contactCount % 2000 < rows.length) log(`${slug}: ${contactCount} contacts…`);
  }

  await sql.query(
    `insert into clients (slug, last_synced_at) values ($1, $2)
     on conflict (slug) do update set last_synced_at = excluded.last_synced_at`,
    [slug, new Date().toISOString()]
  );
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
    results[slug] = await syncClient(cfg, opts);
  }
  return results;
}
