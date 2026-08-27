import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CONTACTS_INCOMPLETE_PREFIX,
  contactsIncompleteMessage,
  isContactsIncomplete,
  parseContactsResumeCursor,
  pastDeadline,
  resolveSyncStages,
  sortSlugsStalestFirst,
} from './syncPolicy.js';

describe('resolveSyncStages', () => {
  it('runs both stages by default', () => {
    assert.deepEqual(resolveSyncStages(), { runStats: true, runContacts: true });
  });

  it('honours an explicit stage', () => {
    assert.deepEqual(resolveSyncStages({ stage: 'stats' }), { runStats: true, runContacts: false });
    assert.deepEqual(resolveSyncStages({ stage: 'contacts' }), { runStats: false, runContacts: true });
    assert.deepEqual(resolveSyncStages({ stage: 'all' }), { runStats: true, runContacts: true });
  });

  it('skips stats when the previous run left a contacts-incomplete error', () => {
    const syncError = contactsIncompleteMessage({ pulled: 12000 });
    assert.deepEqual(resolveSyncStages({ syncError }), { runStats: false, runContacts: true });
  });

  it('does not skip stats for a generic sync_error', () => {
    assert.deepEqual(resolveSyncStages({ syncError: 'HTTP 500' }), {
      runStats: true,
      runContacts: true,
    });
  });

  it('stage=all still re-runs stats even if contacts were incomplete', () => {
    const syncError = contactsIncompleteMessage({ pulled: 12 });
    assert.deepEqual(resolveSyncStages({ stage: 'all', syncError }), {
      runStats: true,
      runContacts: true,
    });
  });
});

describe('contacts incomplete message', () => {
  it('round-trips a resume cursor without confusing isContactsIncomplete', () => {
    const message = contactsIncompleteMessage({ pulled: 1500, cursor: 'abc==xyz' });
    assert.equal(isContactsIncomplete(message), true);
    assert.equal(message.startsWith(CONTACTS_INCOMPLETE_PREFIX), true);
    assert.equal(parseContactsResumeCursor(message), 'abc==xyz');
  });

  it('keeps a resume cursor when the message carries a real error detail', () => {
    const message = contactsIncompleteMessage({
      pulled: 400,
      cursor: 'page-9',
      detail: 'EmailBison /api/leads failed after 3 tries: HTTP 502',
    });
    assert.equal(isContactsIncomplete(message), true);
    assert.equal(parseContactsResumeCursor(message), 'page-9');
    assert.match(message, /HTTP 502/);
  });

  it('returns null cursor when none was stored', () => {
    assert.equal(parseContactsResumeCursor(contactsIncompleteMessage({ pulled: 10 })), null);
    assert.equal(parseContactsResumeCursor(contactsIncompleteMessage({ detail: 'pull in progress' })), null);
    assert.equal(parseContactsResumeCursor('HTTP 500'), null);
    assert.equal(parseContactsResumeCursor(null), null);
  });
});

describe('sortSlugsStalestFirst', () => {
  it('puts contacts-incomplete clients first even when last_synced_at is recent', () => {
    const ordered = sortSlugsStalestFirst(['mdj', 'storylane', 'gtmx'], [
      { slug: 'mdj', last_synced_at: '2026-08-24T11:00:00Z', sync_error: null },
      {
        slug: 'storylane',
        last_synced_at: '2026-08-24T11:30:00Z',
        sync_error: contactsIncompleteMessage({ pulled: 8000 }),
      },
      { slug: 'gtmx', last_synced_at: '2026-08-23T00:00:00Z', sync_error: null },
    ]);
    assert.deepEqual(ordered, ['storylane', 'gtmx', 'mdj']);
  });

  it('orders the rest stalest-first, null last_synced_at first', () => {
    const ordered = sortSlugsStalestFirst(['b', 'a', 'c'], [
      { slug: 'b', last_synced_at: '2026-08-24T00:00:00Z' },
      { slug: 'a', last_synced_at: null },
      { slug: 'c', last_synced_at: '2026-08-20T00:00:00Z' },
    ]);
    assert.deepEqual(ordered, ['a', 'c', 'b']);
  });
});

describe('pastDeadline', () => {
  it('is false without a deadline', () => {
    assert.equal(pastDeadline(undefined, 1_000), false);
    assert.equal(pastDeadline(null, 1_000), false);
  });

  it('is true only once now is past the deadline', () => {
    assert.equal(pastDeadline(1_000, 999), false);
    assert.equal(pastDeadline(1_000, 1_000), false);
    assert.equal(pastDeadline(1_000, 1_001), true);
  });
});
