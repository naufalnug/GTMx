import { getSupabase } from './supabase'
import { articles as staticArticles } from '../data/articles'

/**
 * Blog article data access. Public reads come from the Supabase `articles`
 * table (see scripts/blog-schema.sql) and gracefully fall back to the bundled
 * seed data in data/articles.js when Supabase isn't configured or has no rows
 * yet — so the site keeps rendering before the CMS is wired up. Admin writes
 * go straight to Supabase via the service-role client (server-only).
 */

const PUBLIC_COLUMNS = 'id,slug,title,excerpt,body,tags,status,published_at,created_at'

function rowToArticle(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || '',
    body: row.body || '',
    tags: row.tags || [],
    status: row.status,
    date: row.published_at || row.created_at || new Date().toISOString(),
  }
}

async function tryDb(fn) {
  try {
    return await fn(getSupabase())
  } catch (err) {
    console.error('[articles] Supabase unavailable — using static seed:', err.message)
    return null
  }
}

// ── Public reads ──────────────────────────────────────────────────────────

/** Published articles, newest first. Falls back to the bundled seed data. */
export async function getPublishedArticles() {
  const rows = await tryDb(async (db) => {
    const { data, error } = await db
      .from('articles')
      .select(PUBLIC_COLUMNS)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    if (error) throw error
    return data
  })
  if (rows && rows.length) return rows.map(rowToArticle)
  return staticArticles
}

export async function getPublishedArticleBySlug(slug) {
  const list = await getPublishedArticles()
  return list.find((a) => a.slug === slug) || null
}

// ── Admin CRUD (service-role; call only from authenticated route handlers) ──

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function normalize(input = {}) {
  const title = String(input.title || '').trim()
  const tags = Array.isArray(input.tags)
    ? input.tags.map((t) => String(t).trim()).filter(Boolean)
    : String(input.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
  return {
    slug: slugify(input.slug || title),
    title,
    excerpt: String(input.excerpt || '').trim(),
    body: String(input.body || ''),
    tags,
    status: input.status === 'published' ? 'published' : 'draft',
  }
}

export async function adminListArticles() {
  const db = getSupabase()
  const { data, error } = await db
    .from('articles')
    .select('id,slug,title,status,tags,published_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

export async function adminGetArticle(id) {
  const db = getSupabase()
  const { data, error } = await db.from('articles').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createArticle(input) {
  const db = getSupabase()
  const p = normalize(input)
  if (!p.title) throw new Error('Title is required')
  if (!p.slug) throw new Error('A URL slug is required')
  const row = {
    ...p,
    published_at:
      p.status === 'published' ? input.published_at || new Date().toISOString() : null,
  }
  const { data, error } = await db
    .from('articles')
    .insert(row)
    .select('id,slug,status')
    .single()
  if (error) throw error
  return data
}

export async function updateArticle(id, input) {
  const db = getSupabase()
  const p = normalize(input)
  if (!p.title) throw new Error('Title is required')
  if (!p.slug) throw new Error('A URL slug is required')

  // Stamp published_at the first time a post goes live; keep it thereafter.
  const { data: current, error: e1 } = await db
    .from('articles')
    .select('published_at')
    .eq('id', id)
    .single()
  if (e1) throw e1

  const row = {
    ...p,
    published_at:
      p.status === 'published'
        ? current.published_at || input.published_at || new Date().toISOString()
        : null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await db
    .from('articles')
    .update(row)
    .eq('id', id)
    .select('id,slug,status')
    .single()
  if (error) throw error
  return data
}

export async function deleteArticle(id) {
  const db = getSupabase()
  const { error } = await db.from('articles').delete().eq('id', id)
  if (error) throw error
  return { ok: true }
}
