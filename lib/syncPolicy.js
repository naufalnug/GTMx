/**
 * Policy for the EmailBison → Supabase sync: when last_synced_at may advance,
 * when a contacts pull is treated as incomplete, and how to order clients so
 * a truncated run can finish on the next invocation.
 *
 * last_synced_at used to be written only after the contacts pull. Large
 * workspaces (Storylane: ~62k leads, 100 per page) finish campaign stats inside
 * a 300s Vercel invocation and then get killed mid-contacts — so the dashboard
 * badge never moves and sync_error stays null (the catch never runs).
 */

export const CONTACTS_INCOMPLETE_PREFIX = 'contacts incomplete:';
const CURSOR_MARKER = '\ncursor:';

export function isContactsIncomplete(syncError) {
  return typeof syncError === 'string' && syncError.startsWith(CONTACTS_INCOMPLETE_PREFIX);
}

export function contactsIncompleteMessage({ pulled, cursor, detail } = {}) {
  const head = detail
    ? `${CONTACTS_INCOMPLETE_PREFIX} ${detail}`
    : `${CONTACTS_INCOMPLETE_PREFIX} pulled ${Number(pulled) || 0} leads, ran out of time`;
  return cursor ? `${head}${CURSOR_MARKER}${cursor}` : head;
}

export function parseContactsResumeCursor(syncError) {
  if (!isContactsIncomplete(syncError)) return null;
  const index = syncError.lastIndexOf(CURSOR_MARKER);
  if (index < 0) return null;
  const cursor = syncError.slice(index + CURSOR_MARKER.length).trim();
  return cursor || null;
}

/**
 * Decide which stages to run for one client.
 *
 * `stage` (from ?stage= on the cron route, or omitted):
 *   - `stats`     — campaigns / daily rows / replies only
 *   - `contacts`  — contacted leads only
 *   - `all`/omit  — both, unless the previous run left a contacts-incomplete
 *                   error, in which case stats are skipped so the follow-up
 *                   can spend its budget finishing the leads pull.
 */
export function resolveSyncStages({ stage, syncError } = {}) {
  if (stage === 'stats') return { runStats: true, runContacts: false };
  if (stage === 'contacts') return { runStats: false, runContacts: true };
  if (stage !== 'all' && isContactsIncomplete(syncError)) {
    return { runStats: false, runContacts: true };
  }
  return { runStats: true, runContacts: true };
}

export function pastDeadline(deadline, now = Date.now()) {
  return Boolean(deadline) && now > deadline;
}

/**
 * Clients with an unfinished contacts pull go first so a follow-up run can
 * finish them without waiting behind a freshly stamped last_synced_at.
 * Everyone else is stalest-first (null last_synced_at first).
 */
export function sortSlugsStalestFirst(slugs, rows) {
  const seen = new Map((rows ?? []).map((row) => [row.slug, row]));
  return [...slugs].sort((a, b) => {
    const left = seen.get(a) ?? {};
    const right = seen.get(b) ?? {};
    const leftIncomplete = isContactsIncomplete(left.sync_error);
    const rightIncomplete = isContactsIncomplete(right.sync_error);
    if (leftIncomplete !== rightIncomplete) return leftIncomplete ? -1 : 1;
    const leftTs = left.last_synced_at ? new Date(left.last_synced_at).getTime() : 0;
    const rightTs = right.last_synced_at ? new Date(right.last_synced_at).getTime() : 0;
    return leftTs - rightTs;
  });
}
