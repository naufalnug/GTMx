/**
 * Portal notification events, derived during the sync.
 *
 * No `server-only` guard here on purpose: lib/sync.js imports this and also runs
 * outside Next, from scripts/sync-emailbison-neon.mjs.
 *
 * Nothing in the schema records when a campaign changed — `campaigns.updated_at` is
 * stamped `now()` on every sync run (lib/sync.js), and the upsert overwrites prior
 * values with no history. So events are found by snapshotting the stored state
 * *before* the upsert and diffing the incoming rows against it.
 *
 * The sync runs every 15 minutes and recomputes the same events every time. Rather
 * than track what has already been sent, every event carries a `dedupe_key` derived
 * only from the thing itself, and the insert relies on the unique index
 * portal_notifications_dedupe_idx to make a repeat a no-op.
 */

// A campaign needs a real sample before a ratio means anything — without this a
// single reply from a 20-contact campaign would read as message-market fit.
const MMF_MIN_CONTACTS = 100;
// Contacts emailed per interested lead. At or below this is the fit signal.
const MMF_MAX_RATIO = 500;
// The sync re-pages every campaign's whole reply history each run. If EmailBison
// ever reclassifies old replies as interested, this stops months of history
// arriving as "new".
const LEAD_MAX_AGE_DAYS = 30;
// Anomaly clamp. A bell reading "1,482" is a worse failure than quietly dropping
// the tail of a run that has clearly gone wrong.
const MAX_PER_RUN = 50;

const PAGE = 1000;

function num(value) {
  return Number(value ?? 0);
}

// Campaigns that mail generic business addresses seed the lead name with a greeting
// filler, so full_name comes through as literally "there there". Naming a
// notification after that reads as broken, so treat these as no name at all.
const PLACEHOLDER_NAMES = new Set(['there', 'there there', 'friend', 'hi there', 'team', 'unknown lead']);

/** Best available human identity for a reply, falling back to who they work for. */
function displayName(reply) {
  const full = String(reply.full_name ?? '').trim();
  if (full && !PLACEHOLDER_NAMES.has(full.toLowerCase())) return full;
  const company = String(reply.company ?? '').trim();
  if (company) return company;
  // The sending domain is the most recognisable thing left — "puma.com is interested"
  // still tells the client exactly who replied.
  const domain = String(reply.email_domain ?? '').trim();
  if (domain) return domain;
  return String(reply.email ?? '').trim() || 'A lead';
}

/** Does this campaign's contact-to-interested ratio clear the fit bar? */
function qualifiesForMarketFit(row) {
  if (!row) return false;
  const interested = num(row.interested);
  const contacts = num(row.contacts);
  return interested >= 1 && contacts >= MMF_MIN_CONTACTS && contacts <= MMF_MAX_RATIO * interested;
}

/**
 * Stored state for one client+source, read before the sync overwrites it.
 * `isColdStart` means we have never synced this pair, so there is no "before" to
 * diff against and every row would look new.
 */
export async function loadNotificationBaseline(db, slug, source) {
  const { data: campaigns, error } = await db
    .from('campaigns')
    .select('campaign_id, name, total_leads, contacts, interested, status')
    .eq('client', slug)
    .eq('source', source);
  if (error) throw error;

  // Reply counts can exceed PostgREST's 1000-row default, so page them.
  const replyIds = new Set();
  for (let from = 0; ; from += PAGE) {
    const { data, error: replyError } = await db
      .from('interested_replies')
      .select('reply_id')
      .eq('client', slug)
      .eq('source', source)
      .range(from, from + PAGE - 1);
    if (replyError) throw replyError;
    for (const row of data ?? []) replyIds.add(Number(row.reply_id));
    if (!data || data.length < PAGE) break;
  }

  return {
    campaigns: new Map((campaigns ?? []).map((row) => [Number(row.campaign_id), row])),
    replyIds,
    isColdStart: (campaigns ?? []).length === 0,
  };
}

/**
 * Pure: given the baseline and the rows about to be written, return the
 * notifications to insert. No I/O, so this can be reasoned about and tested directly.
 */
export function buildNotifications(baseline, { slug, source, campaignRows, replyRows }) {
  // A client we have never seen would otherwise get one notification per campaign
  // and per historical reply. Write the baseline silently; the next run diffs
  // against it normally.
  if (baseline.isColdStart) return [];

  const rows = [];
  const now = Date.now();
  const maxAgeMs = LEAD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  for (const reply of replyRows) {
    const replyId = Number(reply.reply_id);
    if (baseline.replyIds.has(replyId)) continue;
    const receivedAt = reply.date_received ? new Date(reply.date_received) : null;
    const eventAt = receivedAt && !Number.isNaN(receivedAt.getTime()) ? receivedAt : new Date();
    if (now - eventAt.getTime() > maxAgeMs) continue;
    const who = displayName(reply);
    rows.push({
      client: slug,
      source,
      kind: 'lead.interested',
      dedupe_key: `lead:${source}:${replyId}`,
      title: `${who} is interested`,
      body: [reply.title, reply.company].filter(Boolean).join(' · ') || reply.subject || null,
      campaign_id: reply.campaign_id ?? null,
      campaign_name: reply.campaign_name ?? null,
      detail: { reply_id: replyId, email: reply.email ?? null, subject: reply.subject ?? null },
      event_at: eventAt.toISOString(),
    });
  }

  for (const campaign of campaignRows) {
    const id = Number(campaign.campaign_id);
    const prior = baseline.campaigns.get(id);
    const name = campaign.name || 'Untitled campaign';
    const status = campaign.status ?? null;

    // Launched: either brand new and already live, or it has left draft. Both write
    // the same key, so a campaign drafted Monday and started Friday fires once, on
    // Friday — which is when the client actually cares.
    const isNewAndLive = !prior && status !== 'draft';
    const leftDraft = prior && prior.status === 'draft' && status !== 'draft';
    if (isNewAndLive || leftDraft) {
      rows.push({
        client: slug,
        source,
        kind: 'campaign.launched',
        dedupe_key: `launch:${source}:${id}`,
        title: `New campaign launched: ${name}`,
        body: `${num(campaign.total_leads).toLocaleString('en-US')} leads queued`,
        campaign_id: id,
        campaign_name: name,
        detail: { status, total_leads: num(campaign.total_leads) },
        event_at: new Date().toISOString(),
      });
    }

    // Leads added. Requires a prior row, which is what stops a brand-new campaign
    // firing both a launch and a leads-added in the same run.
    if (prior && num(campaign.total_leads) > num(prior.total_leads)) {
      const added = num(campaign.total_leads) - num(prior.total_leads);
      rows.push({
        client: slug,
        source,
        kind: 'campaign.leads_added',
        // Keyed on the resulting total, not the delta: re-observing an unchanged
        // campaign yields the same key and writes nothing, while a genuine second
        // batch yields a new one. Trade-off: leads removed and re-added back to
        // exactly the same total are suppressed, which is the right call — the
        // client's world did not change.
        dedupe_key: `leads:${source}:${id}:${num(campaign.total_leads)}`,
        title: `${added.toLocaleString('en-US')} leads added to ${name}`,
        body: `${num(campaign.total_leads).toLocaleString('en-US')} leads in this campaign now`,
        campaign_id: id,
        campaign_name: name,
        detail: { from: num(prior.total_leads), to: num(campaign.total_leads), added },
        event_at: new Date().toISOString(),
      });
    }

    // Message-market fit, on the crossing only. The unique key alone would enforce
    // once-per-campaign, but checking the crossing also means an already-qualifying
    // campaign stays silent the first time this ships — which is what keeps existing
    // clients from getting a wall of fit notifications on deploy day.
    if (qualifiesForMarketFit(campaign) && !qualifiesForMarketFit(prior)) {
      const ratio = Math.round(num(campaign.contacts) / num(campaign.interested));
      rows.push({
        client: slug,
        source,
        kind: 'campaign.message_market_fit',
        dedupe_key: `mmf:${source}:${id}`,
        title: `Message–market fit: ${name}`,
        body: `1 interested lead per ${ratio.toLocaleString('en-US')} contacts`,
        campaign_id: id,
        campaign_name: name,
        detail: { contacts: num(campaign.contacts), interested: num(campaign.interested), ratio },
        event_at: new Date().toISOString(),
      });
    }
  }

  // ON CONFLICT handles duplicates within a statement, but collapsing here removes
  // any dependence on that subtlety.
  const unique = new Map();
  for (const row of rows) if (!unique.has(row.dedupe_key)) unique.set(row.dedupe_key, row);
  const deduped = [...unique.values()];

  if (deduped.length > MAX_PER_RUN) {
    deduped.sort((a, b) => new Date(b.event_at) - new Date(a.event_at));
    console.error(
      `[notifications] ${slug}/${source}: ${deduped.length} events in one run, keeping newest ${MAX_PER_RUN}`
    );
    return deduped.slice(0, MAX_PER_RUN);
  }
  return deduped;
}

/** Insert, letting the unique index drop anything already recorded. */
export async function emitNotifications(db, rows) {
  if (!rows.length) return 0;
  const { error } = await db
    .from('portal_notifications')
    .upsert(rows, { onConflict: 'client,dedupe_key', ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}
