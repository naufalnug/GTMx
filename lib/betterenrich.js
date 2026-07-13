// BetterEnrich API client (https://app.betterenrich.com/api/v1).
//
// Used by the enrichment pass (lib/enrich.js) to waterfall a lead's email into a
// LinkedIn URL and then a mobile phone number.
//
// Verified behaviour:
//  - Auth: header `Authorization: <API_KEY>` (raw, NOT "Bearer").
//  - Async: POST returns 201 { id }; poll `GET <path>?id=<id>` until the top-level
//    `status` is terminal ("success"), then read `data`.
//  - Email -> LinkedIn: POST /find-linkedin-by-email { email }
//      -> data["Linkedin Profile Url"] (+ Name/Title/Company/Domain/Industry...).
//  - LinkedIn -> phone: POST /find-mobile-phone-number { linkedinURL }
//      -> data.mobileNumber (E.164), data.lineType, data.country, data.status.
//  - Rate limit 10 req/s; 403 = insufficient credits. GET /credits -> totalCredit.

const BASE = 'https://app.betterenrich.com/api/v1';
const MIN_INTERVAL_MS = 150; // stay well under 10 req/s across submits + polls
const POLL_TRIES = 18;
const POLL_INTERVAL_MS = 2500;
const PENDING = new Set(['', 'processing', 'pending', 'queued', 'running', 'in_progress']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function isConfigured() {
  return Boolean(process.env.BETTERENRICH_API_KEY);
}

let _nextSlot = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, _nextSlot - now);
  _nextSlot = Math.max(now, _nextSlot) + MIN_INTERVAL_MS;
  if (wait) await sleep(wait);
}

async function beFetch(path, { method = 'GET', body } = {}) {
  const key = process.env.BETTERENRICH_API_KEY;
  if (!key) throw new Error('Missing BETTERENRICH_API_KEY');
  await throttle();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: key, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { message: text }; }
  if (res.status === 403) throw Object.assign(new Error('BetterEnrich: insufficient credits'), { credits: true });
  if (!res.ok) throw new Error(`BetterEnrich ${method} ${path} -> HTTP ${res.status} ${String(json?.message || '').slice(0, 120)}`);
  return json;
}

/** Submit an async job and poll for its result `data`, or null if not found / timed out. */
async function runJob(path, body) {
  const submit = await beFetch(path, { method: 'POST', body });
  const id = submit?.id;
  if (!id) return null;
  for (let i = 0; i < POLL_TRIES; i++) {
    await sleep(POLL_INTERVAL_MS);
    const r = await beFetch(`${path}?id=${encodeURIComponent(id)}`);
    const status = String(r?.status ?? '').toLowerCase();
    if (!PENDING.has(status)) return status === 'success' ? (r?.data ?? null) : null;
  }
  return null; // still processing after the poll window; caller retries next run
}

/** email -> { url, raw } (url null if not found). raw carries Name/Title/Company/etc. */
export async function findLinkedInByEmail(email) {
  if (!email) return { url: null, raw: null };
  const data = await runJob('/find-linkedin-by-email', { email });
  const url = data?.['Linkedin Profile Url'] || null;
  return { url: url || null, raw: data ?? null };
}

/** linkedinUrl -> mobile phone (E.164) or null. */
export async function findMobilePhone(linkedinUrl) {
  if (!linkedinUrl) return null;
  const data = await runJob('/find-mobile-phone-number', { linkedinURL: linkedinUrl });
  if (!data) return null;
  const num = data.mobileNumber || null;
  // Only accept numbers the provider considers valid (avoid writing junk).
  if (num && data.status && String(data.status).toLowerCase() !== 'valid') return null;
  return num;
}

/** Remaining credit balance (for logging). */
export async function getCredits() {
  try {
    const r = await beFetch('/credits');
    return Number(r?.totalCredit ?? 0);
  } catch {
    return null;
  }
}
