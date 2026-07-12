import {
  getGtmxConfig,
  getReply,
  getLead,
  getLatestInterestedReplyForLead,
  pushReplyToTwenty,
} from '../../../../lib/crmPush';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Dig an id out of the various shapes an EmailBison webhook payload might use.
function digId(payload, keys) {
  const roots = [payload, payload?.data, payload?.data?.data].filter(Boolean);
  for (const root of roots) {
    for (const k of keys) {
      const v = k.includes('.')
        ? k.split('.').reduce((o, part) => (o == null ? o : o[part]), root)
        : root[k];
      if (v != null && v !== '') return v;
    }
  }
  return null;
}

function digObject(payload, keys) {
  const roots = [payload, payload?.data, payload?.data?.data].filter(Boolean);
  for (const root of roots) {
    for (const k of keys) {
      const v = root[k];
      if (v && typeof v === 'object') return v;
    }
  }
  return null;
}

/**
 * Real-time receiver for EmailBison `lead_interested` webhooks (GTMx workspace).
 * Auth: a shared secret passed as `?token=` (matched against EMAILBISON_WEBHOOK_SECRET) —
 * we register the webhook URL with the token, so we don't depend on EmailBison's
 * signing scheme. Resolves the triggering interested reply + lead, then pushes to
 * Twenty via the same idempotent path as the reconciliation cron. Always returns
 * 200 quickly for handled events so EmailBison doesn't retry-storm.
 */
export async function POST(request) {
  const secret = process.env.EMAILBISON_WEBHOOK_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || request.headers.get('x-webhook-secret');
    if (token !== secret) return new Response('Unauthorized', { status: 401 });
  }

  const cfg = getGtmxConfig();
  if (!cfg) return Response.json({ ok: false, error: 'GTMx EmailBison not configured' }, { status: 503 });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid JSON' }, { status: 400 });
  }

  try {
    const replyId = digId(payload, ['reply_id', 'reply.id', 'id']);
    const leadId = digId(payload, ['lead_id', 'lead.id', 'contact_id', 'contact.id']);
    const replyInline = digObject(payload, ['reply']);
    const leadInline = digObject(payload, ['lead', 'contact']);

    // Resolve the reply. Prefer a REST fetch by id — its field shape (subject,
    // text_body, lead_id) is canonical and matches the cron path; the webhook's
    // inline reply uses inconsistent names (email_subject). Fall back to the
    // lead's latest interested reply, then to the inline object.
    let reply = null;
    if (replyId) reply = await getReply(cfg, replyId).catch(() => null);
    if (!reply && leadId) reply = await getLatestInterestedReplyForLead(cfg, leadId);
    if (!reply && replyInline && replyInline.text_body) reply = replyInline;
    if (!reply) {
      // Nothing actionable (e.g. a non-reply event) — ack so it isn't retried.
      return Response.json({ ok: true, skipped: 'no interested reply resolved' });
    }

    const resolvedLeadId = reply.lead_id ?? leadId ?? leadInline?.id;
    let lead = leadInline && leadInline.email ? leadInline : null;
    if (!lead && resolvedLeadId) lead = await getLead(cfg, resolvedLeadId).catch(() => null);

    const res = await pushReplyToTwenty({ reply, lead }, { cfg, log: (m) => console.log(m) });
    return Response.json({ ok: true, result: res });
  } catch (err) {
    console.error('EmailBison webhook failed', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
