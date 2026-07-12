#!/usr/bin/env node
/**
 * Push GTMx EmailBison "interested" replies into Twenty CRM (Company + Contact +
 * Note per reply). Idempotent — safe to re-run; already-pushed replies are
 * skipped via the crm_pushed_replies ledger. A Vercel cron hits
 * /api/cron/sync-crm hourly for the same effect.
 *
 *   node scripts/push-crm.mjs --dry     # log intended actions, write nothing
 *   node scripts/push-crm.mjs           # live backfill/reconcile
 *
 * Needs (from .env.local): EMAILBISON_GTMX_API_KEY, EMAILBISON_GTMX_INSTANCE_URL,
 * TWENTY_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
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
    if (m && process.env[m[1]] == null) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

loadEnv();

const { getSupabase } = await import('../lib/supabase.js');
const { reconcileInterestedReplies } = await import('../lib/crmPush.js');

const dryRun = process.argv.slice(2).includes('--dry');
const log = (msg) => process.stdout.write(`${msg}\n`);

reconcileInterestedReplies({ sb: getSupabase(), log, dryRun })
  .then((counts) => {
    log(`\n${dryRun ? 'Dry run' : 'Push'} complete: ${JSON.stringify(counts, null, 2)}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nCRM push failed:', err.message);
    process.exit(1);
  });
