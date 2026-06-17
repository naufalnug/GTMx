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

const SERIES_LABEL_TO_KEY = {
  Sent: 'sent',
  Replied: 'replies',
  Bounced: 'bounced',
};

/**
 * Sums a campaign's daily stats over [start, end] (YYYY-MM-DD). EmailBison's
 * only date-aware stats source is the line-area chart series; it carries
 * Sent / Replied / Bounced (and opens), but NOT unique leads contacted.
 */
export async function getWindowedCampaignStats(config, campaignId, start, end) {
  const data = await ebFetch(
    config,
    `/api/campaigns/${campaignId}/line-area-chart-stats?start_date=${start}&end_date=${end}`
  );
  const out = { sent: 0, replies: 0, bounced: 0 };
  for (const series of data?.data ?? []) {
    const key = SERIES_LABEL_TO_KEY[series?.label];
    if (!key) continue;
    for (const point of series?.dates ?? []) {
      out[key] += Number(point?.[1] ?? 0);
    }
  }
  return out;
}

function isWithinWindow(iso, window) {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const start = Date.parse(`${window.start}T00:00:00Z`);
  const end = Date.parse(`${window.end}T23:59:59Z`);
  return t >= start && t <= end;
}

export async function getInterestedReplies(config, campaignId) {
  const first = await ebFetch(
    config,
    `/api/replies?campaign_id=${campaignId}&page=1`
  );
  const lastPage = Number(first?.meta?.last_page ?? 1);
  const collected = (first?.data ?? []).filter((r) => r?.interested === true);
  if (lastPage <= 1) return collected;
  const pages = [];
  for (let p = 2; p <= lastPage; p++) pages.push(p);
  const rest = await Promise.all(
    pages.map((p) =>
      ebFetch(config, `/api/replies?campaign_id=${campaignId}&page=${p}`)
        .then((d) => (d?.data ?? []).filter((r) => r?.interested === true))
        .catch(() => [])
    )
  );
  for (const arr of rest) collected.push(...arr);
  return collected;
}

function getCustomVar(lead, name) {
  const vars = lead?.custom_variables;
  if (!Array.isArray(vars)) return null;
  const match = vars.find(
    (v) => v?.name && String(v.name).toLowerCase() === name.toLowerCase()
  );
  const value = match?.value;
  if (value == null || value === '') return null;
  return String(value).trim();
}

function extractEmailDomain(email) {
  if (!email || typeof email !== 'string') return '';
  const at = email.lastIndexOf('@');
  if (at < 0) return '';
  return email.slice(at + 1).trim().toLowerCase();
}

export function normalizeInterestedReply(reply, campaign) {
  const lead = reply?.lead ?? {};
  const firstName = lead.first_name ?? '';
  const lastName = lead.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || reply?.from_name || '';
  const email = lead.email ?? reply?.from_email_address ?? '';
  return {
    id: reply?.id,
    campaignId: campaign?.id,
    campaignName: campaign?.name ?? '',
    dateReceived: reply?.date_received ?? reply?.created_at ?? null,
    firstName,
    lastName,
    fullName,
    title: lead.title ?? '',
    company: lead.company ?? '',
    industry: getCustomVar(lead, 'type'),
    email,
    emailDomain: extractEmailDomain(email),
    subject: reply?.subject ?? '',
    snippet: extractReplySnippet(reply?.text_body ?? ''),
  };
}

export async function loadDashboardData(config, window = null) {
  const windowed = Boolean(window?.start && window?.end);
  const campaigns = await listActiveCampaigns(config);
  const enriched = await Promise.all(
    campaigns.map(async (c) => {
      const [steps, interestedRaw, win] = await Promise.all([
        getSequenceSteps(config, c.id).catch(() => []),
        getInterestedReplies(config, c.id).catch(() => []),
        windowed
          ? getWindowedCampaignStats(config, c.id, window.start, window.end).catch(() => null)
          : Promise.resolve(null),
      ]);

      // Positive replies (and their count) are scoped to the window when set,
      // so the headline number always matches the cards below.
      const interestedScoped = windowed
        ? interestedRaw.filter((r) =>
            isWithinWindow(r?.date_received ?? r?.created_at, window)
          )
        : interestedRaw;

      const sent = win ? win.sent : Number(c.emails_sent ?? 0);
      const replies = win ? win.replies : Number(c.unique_replies ?? c.replied ?? 0);
      const bounced = win ? win.bounced : Number(c.bounced ?? 0);
      const interested = interestedScoped.length;
      return {
        id: c.id,
        name: c.name,
        completion: Number(c.completion_percentage ?? 0),
        totalLeads: Number(c.total_leads ?? 0),
        contacts: Number(c.total_leads_contacted ?? 0), // all-time; no date-aware source
        sent,
        replies,
        bounced,
        interested,
        replyRate: sent > 0 ? (replies / sent) * 100 : 0,
        bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
        interestedRate: replies > 0 ? (interested / replies) * 100 : 0,
        steps: steps.map((s) => ({
          id: s.id,
          order: Number(s.order ?? 0),
          subject: s.email_subject ?? '',
          body: s.email_body ?? '',
          waitInDays: Number(s.wait_in_days ?? 0),
          threadReply: Boolean(s.thread_reply),
        })),
        _interestedScoped: interestedScoped,
      };
    })
  );
  enriched.sort((a, b) => b.sent - a.sent);

  const positiveReplies = [];
  for (const c of enriched) {
    for (const r of c._interestedScoped) {
      positiveReplies.push(normalizeInterestedReply(r, c));
    }
    delete c._interestedScoped;
  }
  positiveReplies.sort((a, b) => {
    const da = a.dateReceived ? Date.parse(a.dateReceived) : 0;
    const db = b.dateReceived ? Date.parse(b.dateReceived) : 0;
    return db - da;
  });

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

const QUOTED_ATTRIBUTION = /^[ \t]*On .+wrote:[ \t]*$/m;
const QUOTED_LINE = /^>/;
const SIG_DASH = /^--[ \t]*$/;
const SIG_NAME_ITALIC = /^\*[^*]+\*[ \t]*$/;
const SIG_IMAGE_TAG = /^\[image:/i;
const SIG_NAME_DOUBLE_NEWLINE = /^[A-Z][a-zA-Z'-]+ [A-Z][a-zA-Z'-]+[ \t]*$/;

export function extractReplySnippet(textBody) {
  if (!textBody) return '';
  let text = String(textBody).replace(/\r\n/g, '\n');

  const attrMatch = text.match(QUOTED_ATTRIBUTION);
  if (attrMatch && attrMatch.index != null) {
    text = text.slice(0, attrMatch.index);
  }

  const lines = text.split('\n');
  const out = [];
  for (const line of lines) {
    if (QUOTED_LINE.test(line)) break;
    if (SIG_DASH.test(line)) break;
    if (SIG_NAME_ITALIC.test(line)) break;
    if (SIG_IMAGE_TAG.test(line.trim())) break;
    out.push(line);
  }

  let snippet = out.join('\n');
  while (out.length >= 2) {
    const lastTwo = out.slice(-2);
    if (lastTwo[0].trim() === '' && SIG_NAME_DOUBLE_NEWLINE.test(lastTwo[1].trim())) {
      out.splice(out.length - 2, 2);
      snippet = out.join('\n');
      continue;
    }
    break;
  }

  snippet = snippet.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (snippet.length > 400) {
    snippet = snippet.slice(0, 400).replace(/\s+\S*$/, '') + '…';
  }
  return snippet;
}

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
