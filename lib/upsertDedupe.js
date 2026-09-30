const ROW_TIME_KEYS = ['date_received', 'updated_at', 'created_at', 'date'];

function rowTime(row) {
  for (const key of ROW_TIME_KEYS) {
    const value = row?.[key];
    if (value == null || value === '') continue;
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function rowCompleteness(row) {
  let n = 0;
  for (const value of Object.values(row ?? {})) {
    if (value == null || value === '') continue;
    n += 1;
  }
  return n;
}

/**
 * Collapse rows that share an ON CONFLICT key. Postgres rejects a single
 * `INSERT ... ON CONFLICT DO UPDATE` that would update the same target twice
 * (`cannot affect row a second time`). EmailBison can emit the same reply_id
 * more than once in one pull (page overlap, a lead in multiple campaigns),
 * so the interested_replies batch is the known trigger — callers should run
 * this for every upsert so contacts/campaigns are covered too.
 *
 * Keeps the newest timestamp, then the most complete row, then the later
 * occurrence. Conflict values are stringified so `12` and `"12"` collide.
 */
export function dedupeByConflict(rows, conflictKeys) {
  if (!rows || rows.length < 2) return rows ?? [];
  const chosen = new Map();
  for (const row of rows) {
    const key = conflictKeys.map((k) => String(row?.[k] ?? '')).join('\0');
    const prev = chosen.get(key);
    if (!prev) {
      chosen.set(key, row);
      continue;
    }
    const tNew = rowTime(row);
    const tOld = rowTime(prev);
    if (tNew !== tOld) {
      if (tNew > tOld) chosen.set(key, row);
      continue;
    }
    if (rowCompleteness(row) >= rowCompleteness(prev)) chosen.set(key, row);
  }
  if (chosen.size === rows.length) return rows;
  return [...chosen.values()];
}
