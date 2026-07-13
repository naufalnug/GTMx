// Twenty CRM REST client. Mirrors lib/sync.js `ebFetch` conventions (retry +
// timeout + Bearer auth). Used by the EmailBison -> CRM pipeline to find-or-create
// companies, people, and reply notes idempotently.
//
// REST facts verified live against https://crm.gtmx.run/rest:
//  - paths are plural lowercase: /companies /people /notes /noteTargets
//  - create returns 201 { data: { createCompany|createPerson|createNote|... } }
//  - find-many: GET /people?filter=... -> { data: { people: [...] } }
//  - filter syntax: field[comparator]:value (nested via dot), url-encoded whole
//  - notes: pass bodyV2.markdown; Twenty auto-derives the blocknote document

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000;
// Twenty self-hosted rate-limits to 100 requests / 60s. Space requests ~650ms
// apart (~92/min) so backfills never trip it; a single webhook is well under.
const MIN_INTERVAL_MS = 650;
const MAX_429_WAITS = 8; // safety cap on rate-limit backoffs per request
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function baseUrl() {
  return (process.env.TWENTY_BASE_URL || 'https://crm.gtmx.run').replace(/\/+$/, '');
}

export function isConfigured() {
  return Boolean(process.env.TWENTY_API_KEY);
}

// Serialize + space out all Twenty requests process-wide.
let _nextSlot = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, _nextSlot - now);
  _nextSlot = Math.max(now, _nextSlot) + MIN_INTERVAL_MS;
  if (wait) await sleep(wait);
}

async function twFetch(path, { method = 'GET', body } = {}) {
  const key = process.env.TWENTY_API_KEY;
  if (!key) throw new Error('Missing TWENTY_API_KEY');
  const url = `${baseUrl()}/rest${path}`;
  const headers = { Authorization: `Bearer ${key}`, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let lastErr;
  let rateWaits = 0;
  for (let attempt = 1; attempt <= MAX_RETRIES; ) {
    try {
      await throttle();
      const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.status === 429) {
        // Rate limited — wait out the window and retry without consuming the
        // normal retry budget (up to MAX_429_WAITS times).
        const retryAfter = Number(res.headers.get('retry-after')) || 60;
        if (++rateWaits > MAX_429_WAITS) throw new Error(`Twenty ${method} ${path} rate-limited repeatedly`);
        await sleep(retryAfter * 1000 + 500);
        continue;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`Twenty ${method} ${path} -> HTTP ${res.status} ${text.slice(0, 300)}`);
        // Other 4xx are deterministic — don't waste retries on a bad request.
        if (res.status >= 400 && res.status < 500) throw Object.assign(err, { fatal: true });
        throw err;
      }
      return res.status === 204 ? null : await res.json();
    } catch (err) {
      lastErr = err;
      if (err?.fatal) throw err;
      attempt++;
      if (attempt <= MAX_RETRIES) await sleep(400 * attempt);
    }
  }
  throw new Error(`Twenty ${method} ${path} failed after ${MAX_RETRIES} tries: ${lastErr?.message}`);
}

// Encode a Twenty REST filter expression for the query string.
function filterQuery(expr, extra = '') {
  return `?filter=${encodeURIComponent(expr)}&depth=0&limit=1${extra}`;
}

function normalizeDomain(domain) {
  return String(domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

/**
 * Find-or-create a company. Dedups by website domain first (ilike, to survive
 * Twenty's URL normalization), then by exact name. Setting domainName is what
 * lets Twenty natively enrich the company. Returns the company id, or null when
 * there's nothing to key on.
 */
export async function upsertCompany({ name, domain } = {}) {
  const dom = normalizeDomain(domain);
  const cleanName = (name || '').trim();
  if (!dom && !cleanName) return null;

  if (dom) {
    // Domain is the strong dedup key; when present it's the only lookup we need.
    const found = await twFetch(`/companies${filterQuery(`domainName.primaryLinkUrl[ilike]:%${dom}%`)}`);
    const hit = found?.data?.companies?.[0];
    if (hit) return hit.id;
  } else if (cleanName) {
    const found = await twFetch(`/companies${filterQuery(`name[eq]:${cleanName}`)}`);
    const hit = found?.data?.companies?.[0];
    if (hit) return hit.id;
  }

  const body = { name: cleanName || dom };
  if (dom) body.domainName = { primaryLinkUrl: `https://${dom}` };
  const created = await twFetch('/companies', { method: 'POST', body });
  return created?.data?.createCompany?.id ?? null;
}

/**
 * Find-or-create a person, deduped by primary email. Links to companyId when
 * given. Returns the person id.
 */
export async function upsertPerson({ firstName, lastName, email, jobTitle, companyId } = {}) {
  const mail = (email || '').trim().toLowerCase();
  if (mail) {
    const found = await twFetch(`/people${filterQuery(`emails.primaryEmail[eq]:${mail}`)}`);
    const hit = found?.data?.people?.[0];
    if (hit) return hit.id;
  }
  const body = {
    name: { firstName: firstName || '', lastName: lastName || '' },
  };
  if (mail) body.emails = { primaryEmail: mail };
  if (jobTitle) body.jobTitle = jobTitle;
  if (companyId) body.companyId = companyId;
  const created = await twFetch('/people', { method: 'POST', body });
  return created?.data?.createPerson?.id ?? null;
}

/**
 * Create a note. `markdown` becomes the body (Twenty derives the blocknote doc).
 * No dedup here by design — the caller guarantees one note per reply via the
 * ledger's crm_note_id.
 */
export async function createReplyNote({ title, markdown } = {}) {
  const body = {
    title: title || 'EmailBison reply — interested',
    bodyV2: { markdown: markdown || '', blocknote: null },
  };
  const created = await twFetch('/notes', { method: 'POST', body });
  return created?.data?.createNote?.id ?? null;
}

// Create a noteTarget only if the (note, target) link doesn't already exist —
// makes linking independently resumable.
async function linkOne(noteId, targetKey, targetId) {
  const existing = await twFetch(
    `/noteTargets${filterQuery(`and(noteId[eq]:${noteId},${targetKey}[eq]:${targetId})`)}`
  );
  if (existing?.data?.noteTargets?.length) return;
  await twFetch('/noteTargets', { method: 'POST', body: { noteId, [targetKey]: targetId } });
}

/** Link a note to a person and/or company (idempotent). */
export async function linkNote(noteId, { personId, companyId } = {}) {
  if (!noteId) return;
  if (personId) await linkOne(noteId, 'targetPersonId', personId);
  if (companyId) await linkOne(noteId, 'targetCompanyId', companyId);
}

/**
 * Find-or-create a deal-pipeline Opportunity at the "Lead" stage, linked to the
 * company and the point of contact. Deduped by point of contact so one contact
 * yields one opportunity. Returns the opportunity id.
 */
export async function upsertOpportunity({ name, companyId, personId } = {}) {
  if (personId) {
    const found = await twFetch(`/opportunities${filterQuery(`pointOfContactId[eq]:${personId}`)}`);
    const hit = found?.data?.opportunities?.[0];
    if (hit) return hit.id;
  }
  const body = { name: name || 'Interested lead', stage: 'LEAD' };
  if (companyId) body.companyId = companyId;
  if (personId) body.pointOfContactId = personId;
  const created = await twFetch('/opportunities', { method: 'POST', body });
  return created?.data?.createOpportunity?.id ?? null;
}
