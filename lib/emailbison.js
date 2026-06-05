const REVALIDATE_SECONDS = 300;

async function ebFetch({ baseUrl, apiKey }, path) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`EmailBison ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function listActiveCampaigns(config) {
  const results = [];
  let page = 1;
  while (true) {
    const data = await ebFetch(config, `/api/campaigns?status=active&per_page=100&page=${page}`);
    const items = data?.data ?? data?.campaigns ?? [];
    results.push(...items);
    const meta = data?.meta;
    const hasMore = meta?.current_page < meta?.last_page;
    if (!items.length || !hasMore) break;
    page++;
    if (page > 10) break;
  }
  return results;
}

export async function getSequenceSteps(config, id) {
  const data = await ebFetch(config, `/api/campaigns/v1.1/${id}/sequence-steps`);
  return data?.data?.sequence_steps ?? [];
}

export async function loadDashboardData(config) {
  const campaigns = await listActiveCampaigns(config);
  const enriched = await Promise.all(
    campaigns.map(async (c) => {
      const steps = await getSequenceSteps(config, c.id).catch(() => []);
      const sent = Number(c.emails_sent ?? 0);
      const replies = Number(c.unique_replies ?? c.replied ?? 0);
      const bounced = Number(c.bounced ?? 0);
      return {
        id: c.id,
        name: c.name,
        completion: Number(c.completion_percentage ?? 0),
        totalLeads: Number(c.total_leads ?? 0),
        sent,
        replies,
        bounced,
        replyRate: sent > 0 ? (replies / sent) * 100 : 0,
        bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
        steps: steps.map((s) => ({
          id: s.id,
          order: Number(s.order ?? 0),
          subject: s.email_subject ?? '',
          body: s.email_body ?? '',
          waitInDays: Number(s.wait_in_days ?? 0),
          threadReply: Boolean(s.thread_reply),
        })),
      };
    })
  );
  enriched.sort((a, b) => b.sent - a.sent);
  const totals = enriched.reduce(
    (acc, c) => {
      acc.sent += c.sent;
      acc.replies += c.replies;
      acc.bounced += c.bounced;
      acc.totalLeads += c.totalLeads;
      return acc;
    },
    { sent: 0, replies: 0, bounced: 0, totalLeads: 0 }
  );
  totals.replyRate = totals.sent > 0 ? (totals.replies / totals.sent) * 100 : 0;
  totals.bounceRate = totals.sent > 0 ? (totals.bounced / totals.sent) * 100 : 0;
  return { campaigns: enriched, totals };
}

const HTML_TAG = /<[^>]+>/g;
const HTML_ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

export function htmlToPlainText(html) {
  if (!html) return '';
  let text = String(html);
  text = text.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  text = text.replace(/<\s*\/\s*p\s*>/gi, '\n\n');
  text = text.replace(/<\s*p[^>]*>/gi, '');
  text = text.replace(/<\s*\/\s*div\s*>/gi, '\n');
  text = text.replace(HTML_TAG, '');
  text = text.replace(/&[a-z#0-9]+;/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? m);
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}
