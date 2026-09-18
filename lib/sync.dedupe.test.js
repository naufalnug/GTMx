import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dedupeByConflict } from './upsertDedupe.js';

const REPLY_KEY = ['client', 'source', 'reply_id'];

test('returns the same array when every conflict key is unique', () => {
  const rows = [
    { client: 'flexetc', source: 'gtmx', reply_id: 1, email: 'a@x.com' },
    { client: 'flexetc', source: 'gtmx', reply_id: 2, email: 'b@x.com' },
  ];
  assert.equal(dedupeByConflict(rows, REPLY_KEY), rows);
});

test('keeps the newer date_received when reply_id collides', () => {
  const older = {
    client: 'flexetc',
    source: 'gtmx',
    reply_id: 42,
    date_received: '2026-09-01T00:00:00Z',
    snippet: 'old',
  };
  const newer = {
    client: 'flexetc',
    source: 'gtmx',
    reply_id: 42,
    date_received: '2026-09-03T00:00:00Z',
    snippet: 'new',
  };
  const out = dedupeByConflict([older, newer], REPLY_KEY);
  assert.deepEqual(out, [newer]);
});

test('keeps the earlier row when it is newer, even if it appears first', () => {
  const newer = {
    client: 'flexetc',
    source: 'gtmx',
    reply_id: 7,
    date_received: '2026-09-04T12:00:00Z',
    email: 'a@x.com',
  };
  const older = {
    client: 'flexetc',
    source: 'gtmx',
    reply_id: 7,
    date_received: '2026-09-01T12:00:00Z',
    email: 'a@x.com',
    snippet: 'more complete but older',
  };
  const out = dedupeByConflict([newer, older], REPLY_KEY);
  assert.deepEqual(out, [newer]);
});

test('when timestamps tie, keeps the more complete row', () => {
  const sparse = {
    client: 'flexetc',
    source: 'gtmx',
    reply_id: 9,
    date_received: '2026-09-03T00:00:00Z',
    email: null,
    company: null,
    snippet: '',
  };
  const full = {
    client: 'flexetc',
    source: 'gtmx',
    reply_id: 9,
    date_received: '2026-09-03T00:00:00Z',
    email: 'lead@flexetc.com',
    company: 'FlexEtc',
    snippet: 'yes, interested',
  };
  const out = dedupeByConflict([sparse, full], REPLY_KEY);
  assert.deepEqual(out, [full]);
});

test('treats numeric and string reply_id as the same conflict key', () => {
  const first = { client: 'flexetc', source: 'gtmx', reply_id: 12, date_received: '2026-09-01T00:00:00Z' };
  const second = { client: 'flexetc', source: 'gtmx', reply_id: '12', date_received: '2026-09-02T00:00:00Z' };
  const out = dedupeByConflict([first, second], REPLY_KEY);
  assert.equal(out.length, 1);
  assert.equal(out[0].date_received, '2026-09-02T00:00:00Z');
});

test('does not collapse rows that differ on source', () => {
  const rows = [
    { client: 'flexetc', source: 'gtmx', reply_id: 1 },
    { client: 'flexetc', source: 'dedi', reply_id: 1 },
  ];
  assert.equal(dedupeByConflict(rows, REPLY_KEY).length, 2);
});

test('protects contact batches the same way', () => {
  const contactKey = ['client', 'source', 'lead_id'];
  const stale = { client: 'flexetc', source: 'gtmx', lead_id: 5, updated_at: '2026-09-01T00:00:00Z', email: 'a@x.com' };
  const fresh = { client: 'flexetc', source: 'gtmx', lead_id: 5, updated_at: '2026-09-04T00:00:00Z', email: 'a@x.com' };
  const out = dedupeByConflict([stale, fresh, { client: 'flexetc', source: 'gtmx', lead_id: 6 }], contactKey);
  assert.equal(out.length, 2);
  assert.equal(out[0].updated_at, '2026-09-04T00:00:00Z');
});
