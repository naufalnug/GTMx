import { getSql, queryOne } from './db'
import { articles as staticArticles } from '../data/articles'
import { looksLikeHtml, sanitizeHtml } from './richtext'

/**
 * Blog article data access. Public reads come from the Neon `articles` table
 * (see scripts/neon-schema.sql) and gracefully fall back to the bundled seed
 * data in data/articles.js when Neon isn't configured or has no rows yet — so
 * the site keeps rendering before the CMS is wired up. Admin writes go straight
 * to Neon via the server-only client.
 */

/* gtmx.run serves `<meta property="article:published_time" content="[object Object]">`.
   Next writes that tag as `og.publishedTime.toString()`, and "[object Object]" is
   what you get only when the value is a PLAIN object -- a real Date stringifies to
   "[object Date]" via Object.prototype.toString, and to a date string via its own
   toString. So whatever the Neon driver returns for this `timestamptz` is not a
   Date instance. JSON.stringify and `new Date(x)` both coerced it correctly, which
   is why the JSON-LD and the visible date looked fine and hid the bug for so long.

   This normalises every plausible shape to an ISO 8601 string at the source, so
   every downstream consumer is fixed at once. It is deliberately defensive because
   the exact production shape could not be reproduced locally: DATABASE_URL is empty
   here, so the static seed is served and the bug never appears.

   It returns null rather than inventing a date. The previous code fell back to
   `new Date().toISOString()`, which would have stamped TODAY as the publish date
   on any row it could not parse. */
function toIsoDate(value) {
  if (value === null || value === undefined || value === '') return null

  // Realm-safe Date check: `instanceof` fails across module realms.
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  // Driver wrappers that are not Dates but expose a date-ish accessor.
  if (typeof value === 'object') {
    for (const key of ['toISOString', 'toJSON', 'valueOf']) {
      if (typeof value[key] === 'function') {
        try {
          const out = value[key]()
          if (typeof out === 'string' || typeof out === 'number') {
            const d = new Date(out)
            if (!Number.isNaN(d.getTime())) return d.toISOString()
          }
        } catch {
          /* fall through to the next accessor */
        }
      }
    }
  }
  return null
}

/** Human-readable date, or null when there is no usable date. Callers render
 *  nothing rather than "Invalid Date". */
export function formatArticleDate(value) {
  const iso = toIsoDate(value)
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function rowToArticle(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || '',
    body: row.body || '',
    coverImage: row.cover_image || '',
    coverAlt: row.cover_alt || '',
    ogImage: row.og_image || '',
    metaTitle: row.meta_title || '',
    metaDescription: row.meta_description || '',
    canonicalUrl: row.canonical_url || '',
    customSchema: row.custom_schema ?? null,
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
    tags: row.tags || [],
    status: row.status,
    // No `new Date()` fallback: an unparseable row yields null and the consumers
    // omit the field, rather than asserting that the post was published today.
    date: toIsoDate(row.published_at) || toIsoDate(row.created_at),
    // Real modification date, or null. Never defaulted to the published date, so
    // `dateModified` and `article:modified_time` are only emitted when genuine.
    updatedAt: toIsoDate(row.updated_at),
  }
}

// The bundled seed rows (data/articles.js) may omit optional fields that the
// DB path guarantees via rowToArticle — notably `faqs`, which the article
// template dereferences as `.length`. Normalise the seed rows to the same
// shape so the DB-less fallback renders identically to the DB path and never
// throws on a missing array. No effect on rows that already carry the field.
function normalizeSeedArticle(a) {
  return {
    excerpt: '',
    body: '',
    coverImage: '',
    coverAlt: '',
    ogImage: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    customSchema: null,
    updatedAt: null,
    ...a,
    faqs: Array.isArray(a.faqs) ? a.faqs : [],
    tags: Array.isArray(a.tags) ? a.tags : [],
  }
}

async function tryDb(fn) {
  try {
    return await fn(getSql())
  } catch (err) {
    console.error('[articles] Neon unavailable — using static seed:', err.message)
    return null
  }
}

// ── Public reads ──────────────────────────────────────────────────────────

/** Published articles, newest first. Falls back to the bundled seed data. */
export async function getPublishedArticles() {
  const rows = await tryDb(
    (sql) => sql`
      select id, slug, title, excerpt, body, cover_image, cover_alt, og_image,
             meta_title, meta_description, canonical_url, custom_schema, faqs,
             tags, status, published_at, created_at, updated_at
      from articles
      where status = 'published'
      order by published_at desc nulls last
    `
  )
  if (rows && rows.length) return rows.map(rowToArticle)
  return staticArticles.map(normalizeSeedArticle)
}

export async function getPublishedArticleBySlug(slug) {
  const list = await getPublishedArticles()
  return list.find((a) => a.slug === slug) || null
}

// ── Admin CRUD (server-only; call only from authenticated route handlers) ───

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

// FAQs arrive as [{question, answer}]; keep only complete pairs.
function normalizeFaqs(input) {
  if (!Array.isArray(input)) return []
  return input
    .map((f) => ({
      question: String(f?.question || '').trim(),
      answer: String(f?.answer || '').trim(),
    }))
    .filter((f) => f.question && f.answer)
}

// Custom JSON-LD: a schema.org object or array of objects, as a value or a
// JSON string. Anything else (scalars, bad JSON) is rejected loudly so the
// editor surfaces the mistake instead of publishing broken markup.
function normalizeCustomSchema(input) {
  if (input == null) return null
  let value = input
  if (typeof value === 'string') {
    if (!value.trim()) return null
    try {
      value = JSON.parse(value)
    } catch {
      throw new Error('Custom schema is not valid JSON')
    }
  }
  if (typeof value !== 'object') {
    throw new Error('Custom schema must be a JSON object or array')
  }
  return value
}

function normalize(input = {}) {
  const title = String(input.title || '').trim()
  const tags = Array.isArray(input.tags)
    ? input.tags.map((t) => String(t).trim()).filter(Boolean)
    : String(input.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
  const coverImage = String(input.coverImage ?? input.cover_image ?? '').trim()
  const str = (v) => String(v || '').trim() || null
  const body = String(input.body || '')
  return {
    slug: slugify(input.slug || title),
    title,
    excerpt: String(input.excerpt || '').trim(),
    body: looksLikeHtml(body) ? sanitizeHtml(body) : body,
    cover_image: coverImage || null,
    cover_alt: str(input.coverAlt ?? input.cover_alt),
    og_image: str(input.ogImage ?? input.og_image),
    meta_title: str(input.metaTitle ?? input.meta_title),
    meta_description: str(input.metaDescription ?? input.meta_description),
    canonical_url: str(input.canonicalUrl ?? input.canonical_url),
    custom_schema: normalizeCustomSchema(input.customSchema ?? input.custom_schema),
    faqs: normalizeFaqs(input.faqs),
    tags,
    status: input.status === 'published' ? 'published' : 'draft',
  }
}

export async function adminListArticles() {
  const sql = getSql()
  return sql`
    select id, slug, title, status, tags, published_at, updated_at
    from articles
    order by updated_at desc
    limit 200
  `
}

export async function adminGetArticle(id) {
  const sql = getSql()
  const row = await queryOne(sql, 'select * from articles where id = $1', [id])
  if (!row) throw new Error('Article not found')
  return row
}

export async function createArticle(input) {
  const sql = getSql()
  const p = normalize(input)
  if (!p.title) throw new Error('Title is required')
  if (!p.slug) throw new Error('A URL slug is required')
  const publishedAt =
    p.status === 'published' ? input.published_at || new Date().toISOString() : null
  const row = await queryOne(
    sql,
    `insert into articles (slug, title, excerpt, body, cover_image, cover_alt, og_image,
                           meta_title, meta_description, canonical_url, custom_schema, faqs,
                           tags, status, published_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14, $15)
     returning id, slug, status`,
    [
      p.slug, p.title, p.excerpt, p.body, p.cover_image, p.cover_alt, p.og_image,
      p.meta_title, p.meta_description, p.canonical_url,
      p.custom_schema == null ? null : JSON.stringify(p.custom_schema), JSON.stringify(p.faqs),
      p.tags, p.status, publishedAt,
    ]
  )
  return row
}

export async function updateArticle(id, input) {
  const sql = getSql()
  const p = normalize(input)
  if (!p.title) throw new Error('Title is required')
  if (!p.slug) throw new Error('A URL slug is required')

  // Stamp published_at the first time a post goes live; keep it thereafter.
  const current = await queryOne(sql, 'select published_at from articles where id = $1', [id])
  if (!current) throw new Error('Article not found')

  const publishedAt =
    p.status === 'published'
      ? current.published_at || input.published_at || new Date().toISOString()
      : null

  const row = await queryOne(
    sql,
    `update articles
        set slug = $1, title = $2, excerpt = $3, body = $4, cover_image = $5, cover_alt = $6,
            og_image = $7, meta_title = $8, meta_description = $9, canonical_url = $10,
            custom_schema = $11::jsonb, faqs = $12::jsonb, tags = $13,
            status = $14, published_at = $15, updated_at = now()
      where id = $16
      returning id, slug, status`,
    [
      p.slug, p.title, p.excerpt, p.body, p.cover_image, p.cover_alt, p.og_image,
      p.meta_title, p.meta_description, p.canonical_url,
      p.custom_schema == null ? null : JSON.stringify(p.custom_schema), JSON.stringify(p.faqs),
      p.tags, p.status, publishedAt, id,
    ]
  )
  return row
}

export async function deleteArticle(id) {
  const sql = getSql()
  await sql.query('delete from articles where id = $1', [id])
  return { ok: true }
}
