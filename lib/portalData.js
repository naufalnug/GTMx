import 'server-only';

import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import { decryptPortalValue } from './portalCrypto';

async function allRows(query, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}

function scoped(query, source) {
  return source && source !== 'all' ? query.eq('source', source) : query;
}

export async function getPortalSources(client) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('campaigns').select('source').eq('client', client);
  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.source))].sort();
}

export function resolvePortalSource(requested, sources, fallback = 'all') {
  if (requested === 'all') return 'all';
  if (requested && sources.includes(requested)) return requested;
  if (fallback === 'all' || !sources.includes(fallback)) return 'all';
  return fallback;
}

/**
 * Lifetime contact efficiency — deliberately NOT period-scoped. The ratio answers
 * "how many people do we email to land one interested lead", which only reads
 * correctly over full history; windowing the numerator but not the denominator
 * (a lead often replies weeks after the send) would make it meaningless.
 *
 * A `contacts` row exists only once a lead has been emailed at least once (see the
 * `emails_sent >= 1` filter in lib/sync.js) and is unique per lead, so count(*) is
 * exactly "unique contacts emailed".
 *
 * `sequenceLength` is the longest sequence across the client's campaigns. `contacts`
 * carries no campaign_id, so a per-campaign threshold isn't available — this is the
 * conservative reading: a lead is only "fully sequenced" if it received at least as
 * many emails as the longest sequence.
 */
async function getContactStats(supabase, client, source, sequenceLength) {
  const counter = () =>
    scoped(supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('client', client), source);
  const [emailed, interested, sequenced] = await Promise.all([
    counter(),
    counter().eq('interested', true),
    sequenceLength > 0 ? counter().gte('emails_sent', sequenceLength) : Promise.resolve({ count: 0 }),
  ]);
  for (const result of [emailed, interested, sequenced]) if (result.error) throw result.error;
  const emailedCount = emailed.count ?? 0;
  const interestedCount = interested.count ?? 0;
  return {
    emailed: emailedCount,
    interested: interestedCount,
    fullySequenced: sequenced.count ?? 0,
    sequenceLength,
    // Contacts emailed per interested lead, i.e. "1 in N". Null until the first
    // interested lead lands, so the UI can show a placeholder instead of dividing by 0.
    contactsPerLead: interestedCount ? emailedCount / interestedCount : null,
  };
}

export async function getPortalDashboard(client, period, source) {
  const supabase = await createClient();
  const windowed = Boolean(period?.start && period?.end);
  const campaignsQuery = scoped(
    supabase.from('campaigns').select('*').eq('client', client), source
  );
  const stepsQuery = scoped(
    supabase.from('sequence_steps').select('*').eq('client', client).order('step_order'), source
  );
  let repliesQuery = scoped(
    supabase.from('interested_replies').select('*').eq('client', client).order('date_received', { ascending: false }), source
  );
  if (windowed) repliesQuery = repliesQuery.gte('date_received', `${period.start}T00:00:00Z`).lte('date_received', `${period.end}T23:59:59Z`);

  let dailyQuery = scoped(
    supabase.from('campaign_daily_stats').select('*').eq('client', client).order('date'), source
  );
  if (windowed) dailyQuery = dailyQuery.gte('date', period.start).lte('date', period.end);

  const [campaigns, steps, replies, daily] = await Promise.all([
    allRows(campaignsQuery),
    allRows(stepsQuery),
    allRows(repliesQuery),
    windowed ? allRows(dailyQuery) : Promise.resolve([]),
  ]);
  const key = (row) => `${row.source}:${row.campaign_id}`;
  const stepsByCampaign = new Map();
  for (const step of steps) {
    const list = stepsByCampaign.get(key(step)) ?? [];
    list.push({ id: step.step_id, order: step.step_order, subject: step.subject ?? '', body: step.body ?? '', waitInDays: step.wait_in_days, threadReply: step.thread_reply });
    stepsByCampaign.set(key(step), list);
  }
  const dailyByCampaign = new Map();
  for (const row of daily) {
    const value = dailyByCampaign.get(key(row)) ?? { sent: 0, replies: 0, bounced: 0 };
    value.sent += Number(row.sent ?? 0);
    value.replies += Number(row.replies ?? 0);
    value.bounced += Number(row.bounced ?? 0);
    dailyByCampaign.set(key(row), value);
  }
  const interestedByCampaign = new Map();
  for (const reply of replies) interestedByCampaign.set(key(reply), (interestedByCampaign.get(key(reply)) ?? 0) + 1);

  const enriched = campaigns.map((row) => {
    const stats = windowed ? dailyByCampaign.get(key(row)) ?? { sent: 0, replies: 0, bounced: 0 } : row;
    const sent = Number(stats.sent ?? 0);
    const replyCount = Number(stats.replies ?? 0);
    const bounced = Number(stats.bounced ?? 0);
    return {
      id: `${row.source}-${row.campaign_id}`,
      campaignId: row.campaign_id,
      source: row.source,
      name: row.name ?? 'Untitled campaign',
      status: row.status ?? 'unknown',
      completion: Number(row.completion ?? 0),
      sent, replies: replyCount, bounced,
      interested: interestedByCampaign.get(key(row)) ?? 0,
      replyRate: sent ? (replyCount / sent) * 100 : 0,
      bounceRate: sent ? (bounced / sent) * 100 : 0,
      steps: stepsByCampaign.get(key(row)) ?? [],
    };
  }).filter((row) => row.sent > 0).sort((a, b) => b.sent - a.sent);

  const totals = enriched.reduce((out, row) => {
    out.sent += row.sent; out.replies += row.replies; out.bounced += row.bounced; out.interested += row.interested;
    return out;
  }, { sent: 0, replies: 0, bounced: 0, interested: 0 });
  totals.replyRate = totals.sent ? (totals.replies / totals.sent) * 100 : 0;
  totals.bounceRate = totals.sent ? (totals.bounced / totals.sent) * 100 : 0;

  const trend = new Map();
  for (const row of daily) {
    const point = trend.get(row.date) ?? { date: row.date, sent: 0, replies: 0 };
    point.sent += Number(row.sent ?? 0); point.replies += Number(row.replies ?? 0);
    trend.set(row.date, point);
  }

  // Read from every campaign's steps, not just `enriched` — that list is filtered to
  // campaigns with sends in the window, and the sequence length must not move with the
  // reporting period.
  let sequenceLength = 0;
  for (const list of stepsByCampaign.values()) sequenceLength = Math.max(sequenceLength, list.length);
  const contacts = await getContactStats(supabase, client, source, sequenceLength);

  return {
    campaigns: enriched,
    totals,
    contacts,
    trend: [...trend.values()],
    positiveReplies: replies.map((row) => ({
      id: row.reply_id, campaignId: row.campaign_id, campaignName: row.campaign_name ?? '',
      dateReceived: row.date_received, fullName: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Unknown lead',
      title: row.title ?? '', company: row.company ?? '', industry: row.industry ?? '', email: row.email ?? '',
      emailDomain: row.email_domain ?? '', subject: row.subject ?? '', snippet: row.snippet ?? '',
    })),
  };
}

/**
 * Inbox embed config for a client.
 *
 * MasterInbox authenticates the embed by postMessage from the parent page, so its
 * credentials necessarily reach the browser — that is the vendor's design, not a
 * choice here. They are encrypted at rest and this is only ever called after
 * requirePortalClient, so they reach exactly one authenticated member of that
 * client (or an admin previewing it) and nobody else. Never log the return value.
 */
export async function getClientInbox(client) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('clients')
    .select('inbox_url_ciphertext, inbox_provider, inbox_credentials_ciphertext')
    .eq('slug', client)
    .single();
  if (error) throw error;
  const url = data?.inbox_url_ciphertext ? decryptPortalValue(data.inbox_url_ciphertext) : null;
  if (!url) return null;

  const provider = data.inbox_provider ?? 'iframe';
  if (provider !== 'masterinbox') return { url, provider, credentials: null };

  let credentials = null;
  if (data.inbox_credentials_ciphertext) {
    try {
      credentials = JSON.parse(decryptPortalValue(data.inbox_credentials_ciphertext));
    } catch {
      // A malformed or undecryptable blob must not take the whole page down — the
      // frame falls back to showing MasterInbox's own login.
      credentials = null;
    }
  }
  return { url, provider, credentials };
}

/**
 * Notification feed for the bell.
 *
 * Unread = above the membership watermark AND not individually dismissed. Two
 * mechanisms because "mark all read" must not write a row per notification, but a
 * single item still needs to be dismissable without burying everything older.
 *
 * Reads through the RLS-scoped client, like every other read here — the policies
 * exist to be exercised, not bypassed.
 */
export async function getPortalNotifications(client, { userId, limit = 20 } = {}) {
  const supabase = await createClient();

  let watermark = 0;
  if (userId) {
    const { data } = await supabase
      .from('portal_memberships')
      .select('notifications_read_through_id')
      .eq('user_id', userId)
      .maybeSingle();
    watermark = Number(data?.notifications_read_through_id ?? 0);
  }

  // limit + 1 tells us there's another page without paying for a count query.
  // The id tiebreak keeps paging stable when events share an event_at.
  const { data: page, error } = await supabase
    .from('portal_notifications')
    .select('id, kind, title, body, campaign_name, detail, event_at')
    .eq('client', client)
    .order('event_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  if (error) throw error;

  const rows = page ?? [];
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  let dismissed = new Set();
  if (userId && items.length) {
    const { data } = await supabase
      .from('portal_notification_reads')
      .select('notification_id')
      .eq('user_id', userId)
      .in('notification_id', items.map((row) => row.id));
    dismissed = new Set((data ?? []).map((row) => Number(row.notification_id)));
  }

  let unreadCount = 0;
  if (userId) {
    // Two indexed head-counts subtracted. A read row can only exist for a
    // notification that exists (FK), and anything at or below the watermark is read
    // by definition, so this cannot double-count.
    const [total, read] = await Promise.all([
      supabase.from('portal_notifications').select('*', { count: 'exact', head: true })
        .eq('client', client).gt('id', watermark),
      supabase.from('portal_notification_reads').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).eq('client', client).gt('notification_id', watermark),
    ]);
    unreadCount = Math.max(0, (total.count ?? 0) - (read.count ?? 0));
  }

  return {
    items: items.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      campaignName: row.campaign_name,
      eventAt: row.event_at,
      read: row.id <= watermark || dismissed.has(Number(row.id)),
    })),
    unreadCount,
    latestId: rows.length ? Number(rows[0].id) : watermark,
    hasMore,
  };
}
