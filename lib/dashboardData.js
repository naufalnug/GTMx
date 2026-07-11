import { getSql } from './db.js';

// Builds "client = $1 [and source = $N]" plus its params. `source === 'all'`
// spans every instance. Additional conditions can be appended by the caller
// using params.length to keep placeholder numbering correct.
function scope(slug, source) {
  const params = [slug];
  let where = 'client = $1';
  if (source !== 'all') {
    params.push(source);
    where += ` and source = $${params.length}`;
  }
  return { where, params };
}

// Distinct EmailBison sources stored for a client (e.g. ['dedi', 'gtmx']).
export async function getClientSources(slug) {
  const sql = getSql();
  const rows = await sql.query(
    'select distinct source from campaigns where client = $1',
    [slug]
  );
  return rows.map((r) => r.source).sort();
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
 * Builds the dashboard payload from Neon, returning the exact shapes the
 * dashboard components already expect: { campaigns, totals, positiveReplies }.
 *
 * `source` scopes to one EmailBison instance ('gtmx'/'dedi') or 'all'. All-time
 * uses each campaign's stored totals; a date window sums campaign_daily_stats
 * over [start, end] and scopes interested replies by date_received.
 */
export async function loadDashboardData(slug, period = null, source = 'all') {
  const sql = getSql();
  const windowed = Boolean(period?.start && period?.end);

  const campaignScope = scope(slug, source);

  const stepScope = scope(slug, source);

  const replyScope = scope(slug, source);
  let replyWhere = replyScope.where;
  if (windowed) {
    replyScope.params.push(`${period.start}T00:00:00Z`);
    replyWhere += ` and date_received >= $${replyScope.params.length}`;
    replyScope.params.push(`${period.end}T23:59:59Z`);
    replyWhere += ` and date_received <= $${replyScope.params.length}`;
  }

  const [campaignRows, stepRows, replyRows] = await Promise.all([
    sql.query(`select * from campaigns where ${campaignScope.where}`, campaignScope.params),
    sql.query(
      `select * from sequence_steps where ${stepScope.where} order by step_order asc`,
      stepScope.params
    ),
    sql.query(
      `select * from interested_replies where ${replyWhere} order by date_received desc`,
      replyScope.params
    ),
  ]);

  // IDs are only unique within an EmailBison instance, so a client can hold two
  // campaigns sharing a campaign_id across sources — key every per-campaign map
  // by (source, campaign_id), not campaign_id alone.
  const ck = (source, campaignId) => `${source}:${campaignId}`;

  let windowByCampaign = null;
  if (windowed) {
    const dailyScope = scope(slug, source);
    let dailyWhere = dailyScope.where;
    dailyScope.params.push(period.start);
    dailyWhere += ` and date >= $${dailyScope.params.length}`;
    dailyScope.params.push(period.end);
    dailyWhere += ` and date <= $${dailyScope.params.length}`;
    const daily = await sql.query(
      `select * from campaign_daily_stats where ${dailyWhere}`,
      dailyScope.params
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
