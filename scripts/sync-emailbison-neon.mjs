#!/usr/bin/env node
/**
 * Pull every client's outreach data from EmailBison into Neon.
 *
 * Reads each client's instance URL + API key from the environment (see
 * lib/clients.js for the env var names), falling back to .env.local so it
 * "just works" locally. Also needs DATABASE_URL (the Neon connection string).
 *
 *   node scripts/sync-emailbison-neon.mjs            # all clients
 *   node scripts/sync-emailbison-neon.mjs storylane  # one client
 *
 * One-off import from an explicit instance/key (archive a secondary EmailBison
 * instance's data under an existing client slug; row `source` is derived from
 * the host so it coexists with the client's normal data):
 *   node scripts/sync-emailbison-neon.mjs storylane \
 *     --instance=https://dedi.emailbison.com --key='123|abc...'
 *
 * Idempotent — safe to re-run. A Vercel cron hits /api/cron/sync for the same
 * effect on a schedule.
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

// Import after env is loaded so credentials resolve at module-call time.
const { runSync, syncClient } = await import('../lib/sync.js');

const flags = {};
const slugs = [];
for (const arg of process.argv.slice(2)) {
  const m = arg.match(/^--([^=]+)=(.*)$/);
  if (m) flags[m[1]] = m[2];
  else slugs.push(arg);
}
const log = (msg) => process.stdout.write(`${msg}\n`);

async function run() {
  if (flags.instance || flags.key) {
    if (!flags.instance || !flags.key || slugs.length !== 1) {
      throw new Error('--instance and --key require exactly one client slug');
    }
    const res = await syncClient(
      { slug: slugs[0], baseUrl: flags.instance, apiKey: flags.key },
      { log }
    );
    return { [slugs[0]]: res };
  }
  return runSync(slugs, { log });
}

run()
  .then((res) => {
    log('\nSync complete:');
    log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nSync failed:', err.message);
    process.exit(1);
  });
