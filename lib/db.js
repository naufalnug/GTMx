import { neon } from '@neondatabase/serverless';

/**
 * Server-only Neon (Vercel Postgres) client. Everything dynamic on the site —
 * the blog CMS (`articles`) and the client dashboards (`campaigns`,
 * `contacts`, …) — reads and writes through here. The connection string is the
 * pooled `DATABASE_URL` that Vercel's Neon integration provisions (it also sets
 * `POSTGRES_URL`, which we accept as a fallback for local use).
 *
 * `neon()` runs each query as a single HTTPS round-trip, which is exactly what
 * serverless/edge functions want — no pool to warm, no socket to leak. Use the
 * returned `sql` as a tagged template for static queries
 * (`sql\`select ... where id = ${id}\``) or `sql.query(text, params)` for
 * queries with a dynamic shape. Both return an array of row objects.
 */
let cached = null;

export function getSql() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error('Missing DATABASE_URL (Neon connection string)');
  }
  cached = neon(url);
  return cached;
}

/** First row of a parameterized query, or null. */
export async function queryOne(sql, text, params = []) {
  const rows = await sql.query(text, params);
  return rows[0] ?? null;
}

// Postgres caps a statement at 65535 bind parameters; chunk well under that.
const MAX_PARAMS = 50000;

function serialize(value, cast) {
  if (value === undefined) return null;
  // jsonb params must arrive as a JSON string (with a ::jsonb cast on the
  // placeholder); plain JS arrays are left alone so the driver serializes them
  // into a Postgres array literal for text[]/int[] columns.
  if (cast === 'jsonb') return value == null ? null : JSON.stringify(value);
  return value;
}

/**
 * Multi-row `INSERT ... ON CONFLICT DO UPDATE`, batched so we never exceed the
 * bind-parameter cap. Mirrors the old Supabase `.upsert(rows, { onConflict })`.
 *
 *   columns  – column names, in order, present on every row object
 *   rows     – array of plain objects keyed by column name
 *   conflict – the conflict-target columns (must be a unique index / PK)
 *   update   – columns to overwrite on conflict (default: all non-conflict cols)
 *   casts    – optional { column: 'jsonb' } to cast a placeholder + JSON-encode
 *
 * Returns the number of rows sent.
 */
export async function bulkUpsert(sql, { table, columns, rows, conflict, update, casts = {} }) {
  if (!rows || !rows.length) return 0;
  const chunkSize = Math.max(1, Math.floor(MAX_PARAMS / columns.length));
  const updateCols = update ?? columns.filter((c) => !conflict.includes(c));
  const setClause = updateCols.length
    ? `DO UPDATE SET ${updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(', ')}`
    : 'DO NOTHING';

  let total = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const params = [];
    const tuples = chunk.map((row) => {
      const placeholders = columns.map((col) => {
        params.push(serialize(row[col], casts[col]));
        return `$${params.length}${casts[col] ? `::${casts[col]}` : ''}`;
      });
      return `(${placeholders.join(',')})`;
    });
    const text =
      `INSERT INTO ${table} (${columns.join(',')}) VALUES ${tuples.join(',')} ` +
      `ON CONFLICT (${conflict.join(',')}) ${setClause}`;
    await sql.query(text, params);
    total += chunk.length;
  }
  return total;
}
