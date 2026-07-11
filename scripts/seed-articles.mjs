#!/usr/bin/env node
/**
 * Seed the Neon `articles` table with the bundled starter posts
 * (data/articles.js). Idempotent — upserts on `slug`, so re-running updates
 * existing rows instead of duplicating them.
 *
 * Prereqs:
 *   1. Run scripts/neon-schema.sql against your Neon database (creates the table).
 *   2. DATABASE_URL in the environment or .env.local.
 *
 *   node scripts/seed-articles.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
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

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!url) {
  console.error('✗ Missing DATABASE_URL (set it or add to .env.local).')
  process.exit(1)
}

const sql = neon(url)

try {
  for (const a of articles) {
    await sql.query(
      `insert into articles (slug, title, excerpt, body, tags, status, published_at)
       values ($1, $2, $3, $4, $5, 'published', $6)
       on conflict (slug) do update set
         title = excluded.title,
         excerpt = excluded.excerpt,
         body = excluded.body,
         tags = excluded.tags,
         status = excluded.status,
         published_at = excluded.published_at,
         updated_at = now()`,
      [a.slug, a.title, a.excerpt || '', a.body || '', a.tags || [], new Date(a.date).toISOString()]
    )
  }
  console.log(`✓ Seeded ${articles.length} article(s) into Neon.`)
  process.exit(0)
} catch (err) {
  console.error('✗ Seed failed:', err.message)
  if (err.code === '42P01') {
    console.error('  The `articles` table does not exist yet — run scripts/neon-schema.sql first.')
  }
  process.exit(1)
}
