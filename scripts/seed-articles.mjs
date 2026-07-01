#!/usr/bin/env node
/**
 * Seed the Supabase `articles` table with the bundled starter posts
 * (data/articles.js). Idempotent — upserts on `slug`, so re-running updates
 * existing rows instead of duplicating them.
 *
 * Prereqs:
 *   1. Run scripts/blog-schema.sql in the Supabase SQL editor (creates the table).
 *   2. SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment or .env.local.
 *
 *   node scripts/seed-articles.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { articles } from '../data/articles.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] == null) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

loadEnv()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('✗ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them or add to .env.local).')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const rows = articles.map((a) => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt || '',
  body: a.body || '',
  tags: a.tags || [],
  status: 'published',
  published_at: new Date(a.date).toISOString(),
}))

const { error } = await supabase.from('articles').upsert(rows, { onConflict: 'slug' })
if (error) {
  console.error('✗ Seed failed:', error.message)
  if (error.code === '42P01') {
    console.error('  The `articles` table does not exist yet — run scripts/blog-schema.sql first.')
  }
  process.exit(1)
}

console.log(`✓ Seeded ${rows.length} article(s) into Supabase.`)
process.exit(0)
