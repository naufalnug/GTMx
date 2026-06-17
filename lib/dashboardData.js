import { getSupabase } from './supabase.js';

const PAGE = 1000; // PostgREST default max rows per request

// Pages through a table past the 1000-row cap. `apply` adds filters/order.
async function fetchAll(sb, table, apply) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await apply(sb.from(table).select('*')).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

// Distinct EmailBison sources stored for a client (e.g. ['dedi', 'gtmx']).
export async function getClientSources(slug) {
  const sb = getSupabase();
  const { data, error } = await sb.from('campaigns').select('source').eq('client', slug);
  if (error) throw new Error(`sources: ${error.message}`);
  return [...new Set((data ?? []).map((r) => r.source))].sort();
}

// Resolves the active source: an explicit ?source= (if valid), else the
// client's default, else 'all'. 'all' combines every source.
export function resolveSource(requested, sources, defaultSource) {
  if (requested === 'all') return 'all';
  if (requested && sources.includes(requested)) return requested;
  if (defaultSource === 'all') return 'all';
  if (defaultSource && sources.includes(defaultSource)) return defaultSource;
  return 'all';
}

/**
 * Builds the dashboard payload from Supabase, returning the exact shapes the
 * dashboard components already expect: { campaigns, totals, positiveReplies }.
 *
 * `source` scopes to one EmailBison instance ('gtmx'/'dedi') or 'all'. All-time
 * uses each campaign's stored totals; a date window sums campaign_daily_stats
 * over [start, end] and scopes interested replies by date_received.
 */
export async function loadDashboardData(slug, period = null, source = 'all') {
  const sb = getSupabase();
  const windowed = Boolean(period?.start && period?.end);
  const bySource = (q) => (source === 'all' ? q : q.eq('source', source));

  const [campaignRows, stepRows, replyRows] = await Promise.all([
    fetchAll(sb, 'campaigns', (q) => bySource(q.eq('client', slug))),
    fetchAll(sb, 'sequence_steps', (q) =>
      bySource(q.eq('client', slug)).order('step_order', { ascending: true })
    ),
    fetchAll(sb, 'interested_replies', (q) => {
      let qq = bySource(q.eq('client', slug));
      if (windowed) {
        qq = qq
          .gte('date_received', `${period.start}T00:00:00Z`)
          .lte('date_received', `${period.end}T23:59:59Z`);
      }
      return qq.order('date_received', { ascending: false });
    }),
  ]);

  // IDs are only unique within an EmailBison instance, so a client can hold two
  // campaigns sharing a campaign_id across sources — key every per-campaign map
  // by (source, campaign_id), not campaign_id alone.
  const ck = (source, campaignId) => `${source}:${campaignId}`;

  let windowByCampaign = null;
  if (windowed) {
    const daily = await fetchAll(sb, 'campaign_daily_stats', (q) =>
      bySource(q.eq('client', slug)).gte('date', period.start).lte('date', period.end)
    );
    windowByCampaign = new Map();
    for (const d of daily) {
      const k = ck(d.source, d.campaign_id);
      let row = windowByCampaign.get(k);
      if (!row) {
        row = { sent: 0, replies: 0, bounced: 0 };
        windowByCampaign.set(k, row);
      }
      row.sent += Number(d.sent ?? 0);
      row.replies += Number(d.replies ?? 0);
      row.bounced += Number(d.bounced ?? 0);
    }
  }

  const stepsByCampaign = new Map();
  for (const s of stepRows) {
    const k = ck(s.source, s.campaign_id);
    if (!stepsByCampaign.has(k)) stepsByCampaign.set(k, []);
    stepsByCampaign.get(k).push({
      id: s.step_id,
      order: Number(s.step_order ?? 0),
      subject: s.subject ?? '',
      body: s.body ?? '',
      waitInDays: Number(s.wait_in_days ?? 0),
      threadReply: Boolean(s.thread_reply),
    });
  }

  const interestedByCampaign = new Map();
  for (const r of replyRows) {
    const k = ck(r.source, r.campaign_id);
    interestedByCampaign.set(k, (interestedByCampaign.get(k) ?? 0) + 1);
  }

  let enriched = campaignRows.map((c) => {
    const k = ck(c.source, c.campaign_id);
    const win = windowByCampaign ? windowByCampaign.get(k) : null;
    const sent = win ? win.sent : Number(c.sent ?? 0);
    const replies = win ? win.replies : Number(c.replies ?? 0);
    const bounced = win ? win.bounced : Number(c.bounced ?? 0);
    const interested = interestedByCampaign.get(k) ?? 0;
    return {
      id: `${c.source}-${c.campaign_id}`,
      name: c.name ?? '',
      completion: Number(c.completion ?? 0),
      totalLeads: Number(c.total_leads ?? 0),
      contacts: Number(c.contacts ?? 0), // all-time; no date-aware source
      sent,
      replies,
      bounced,
      interested,
      replyRate: sent > 0 ? (replies / sent) * 100 : 0,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      interestedRate: replies > 0 ? (interested / replies) * 100 : 0,
      steps: (stepsByCampaign.get(k) ?? []).sort((a, b) => a.order - b.order),
    };
  });

  // Show campaigns with sends in the current scope (mirrors the old live
  // dashboard's intent, but lets completed campaigns appear in past windows).
  enriched = enriched.filter((c) => c.sent > 0).sort((a, b) => b.sent - a.sent);

  const positiveReplies = replyRows.map((r) => ({
    id: r.reply_id,
    campaignId: r.campaign_id,
    campaignName: r.campaign_name ?? '',
    dateReceived: r.date_received,
    firstName: r.first_name ?? '',
    lastName: r.last_name ?? '',
    fullName: r.full_name ?? '',
    title: r.title ?? '',
    company: r.company ?? '',
    industry: r.industry ?? null,
    email: r.email ?? '',
    emailDomain: r.email_domain ?? '',
    subject: r.subject ?? '',
    snippet: r.snippet ?? '',
  }));

  const totals = enriched.reduce(
    (acc, c) => {
      acc.sent += c.sent;
      acc.replies += c.replies;
      acc.bounced += c.bounced;
      acc.interested += c.interested;
      acc.totalLeads += c.totalLeads;
      acc.contacts += c.contacts;
      return acc;
    },
    { sent: 0, replies: 0, bounced: 0, interested: 0, totalLeads: 0, contacts: 0 }
  );
  totals.replyRate = totals.sent > 0 ? (totals.replies / totals.sent) * 100 : 0;
  totals.bounceRate = totals.sent > 0 ? (totals.bounced / totals.sent) * 100 : 0;
  totals.interestedRate = totals.replies > 0 ? (totals.interested / totals.replies) * 100 : 0;

  return { campaigns: enriched, totals, positiveReplies };
}
