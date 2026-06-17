import { createClient } from '@supabase/supabase-js';

let cached = null;

/**
 * Server-only Supabase client using the service-role key. Used by the dashboard
 * server components and the sync script/cron — never shipped to the browser.
 * The service role bypasses RLS, which is why every table is RLS-locked with no
 * public policies.
 */
export function getSupabase() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
