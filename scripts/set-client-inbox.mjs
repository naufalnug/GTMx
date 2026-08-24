#!/usr/bin/env node
/**
 * Configure a client's portal inbox embed. Values are encrypted with
 * PORTAL_ENCRYPTION_KEY before they touch the database, and are read from the
 * environment rather than argv so they never land in shell history.
 *
 *   MI_DOMAIN=acme.com MI_EMAIL=user@acme.com MI_PASSWORD='...' \
 *     node scripts/set-client-inbox.mjs flexetc masterinbox
 *
 *   INBOX_URL=https://example.com/inbox node scripts/set-client-inbox.mjs someclient iframe
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['.env.local', '.env']) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

// lib/portalCrypto.js is guarded by `server-only`, which throws outside a Next
// runtime. Neutralise the guard so this CLI can reuse the exact same cipher
// rather than keeping a second copy that could drift out of sync with it.
const require = createRequire(import.meta.url);
require.cache[require.resolve('server-only')] = { id: 'server-only', filename: 'server-only', loaded: true, exports: {} };
const { encryptPortalValue } = await import('../lib/portalCrypto.js');

const slug = process.argv[2];
const provider = process.argv[3] ?? 'masterinbox';
if (!slug) throw new Error('Usage: node scripts/set-client-inbox.mjs <slug> [masterinbox|iframe]');
if (!['masterinbox', 'iframe'].includes(provider)) throw new Error(`Unknown provider: ${provider}`);

const changes = { inbox_provider: provider, updated_at: new Date().toISOString() };

if (provider === 'masterinbox') {
  const domain = process.env.MI_DOMAIN;
  const email = process.env.MI_EMAIL;
  const password = process.env.MI_PASSWORD;
  if (!domain || !email || !password) throw new Error('Set MI_DOMAIN, MI_EMAIL and MI_PASSWORD.');
  changes.inbox_url_ciphertext = encryptPortalValue(
    `https://app.masterinbox.com/?embed-view=${encodeURIComponent(domain)}`
  );
  changes.inbox_credentials_ciphertext = encryptPortalValue(JSON.stringify({ email, password }));
} else {
  const url = process.env.INBOX_URL;
  if (!url) throw new Error('Set INBOX_URL.');
  changes.inbox_url_ciphertext = encryptPortalValue(url);
  changes.inbox_credentials_ciphertext = null;
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await admin.from('clients').update(changes).eq('slug', slug).select('slug').maybeSingle();
if (error) throw error;
if (!data) throw new Error(`No client with slug "${slug}".`);
console.log(`Inbox configured for ${slug} (provider=${provider}). Values stored encrypted.`);
