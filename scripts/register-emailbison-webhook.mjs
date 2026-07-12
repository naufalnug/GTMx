#!/usr/bin/env node
/**
 * Register (once) the EmailBison `lead_interested` webhook for the GTMx workspace
 * so interested replies flow into Twenty in real time. Idempotent — if a webhook
 * already points at our endpoint it is left as-is.
 *
 *   APP_BASE_URL=https://gtmx.run node scripts/register-emailbison-webhook.mjs
 *
 * Run this AFTER the app (with app/api/webhooks/emailbison) is deployed, since
 * EmailBison delivers to the URL. Needs EMAILBISON_GTMX_API_KEY +
 * EMAILBISON_WEBHOOK_SECRET (from .env.local); APP_BASE_URL defaults to https://gtmx.run.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const API_KEY = process.env.EMAILBISON_GTMX_API_KEY;
const INSTANCE = (process.env.EMAILBISON_GTMX_INSTANCE_URL || 'https://send.gtmx.run').replace(/\/+$/, '');
const SECRET = process.env.EMAILBISON_WEBHOOK_SECRET || '';
const APP_BASE = (process.env.APP_BASE_URL || 'https://gtmx.run').replace(/\/+$/, '');
const ENDPOINT = `${APP_BASE}/api/webhooks/emailbison${SECRET ? `?token=${SECRET}` : ''}`;
const EVENT = 'lead_interested';

if (!API_KEY) {
  console.error('Missing EMAILBISON_GTMX_API_KEY');
  process.exit(1);
}

async function eb(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`${INSTANCE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${pathname} -> HTTP ${res.status} ${text.slice(0, 300)}`);
  return json;
}

async function main() {
  // Compare against the base path (ignore the token query) so we don't duplicate.
  const base = ENDPOINT.split('?')[0];
  const existing = await eb('/api/webhook-url');
  const hooks = existing?.data ?? [];
  const match = hooks.find((h) => String(h?.url || '').split('?')[0] === base);

  if (match) {
    const hasEvent = (match.events || []).includes(EVENT);
    console.log(`Webhook already exists (id=${match.id}, events=${JSON.stringify(match.events)}).`);
    if (!hasEvent) {
      console.log(`Note: it does not include "${EVENT}". Update it in the EmailBison UI or via PUT /api/webhook-url/${match.id}.`);
    }
    console.log(`Endpoint: ${ENDPOINT}`);
    return;
  }

  const created = await eb('/api/webhook-url', {
    method: 'POST',
    body: { name: 'Twenty CRM — interested replies', url: ENDPOINT, events: [EVENT] },
  });
  console.log(`Created webhook id=${created?.data?.id} -> ${ENDPOINT}`);
  console.log(`Subscribed events: ${JSON.stringify(created?.data?.events)}`);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
