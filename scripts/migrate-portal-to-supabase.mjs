/** One-time Neon -> Supabase client portal migration with count verification. */
import { getSql } from '../lib/db.js';
import { createClient } from '@supabase/supabase-js';

const TABLES = ['campaigns', 'campaign_daily_stats', 'sequence_steps', 'interested_replies', 'contacts'];
const CONFLICTS = { campaigns: 'client,source,campaign_id', campaign_daily_stats: 'client,source,campaign_id,date', sequence_steps: 'client,source,campaign_id,step_id', interested_replies: 'client,source,reply_id', contacts: 'client,source,lead_id' };

async function migrateTable(sql, supabase, table) {
  const [{ count }] = await sql.query(`select count(*)::int as count from ${table}`);
  let moved = 0;
  while (moved < count) {
    const rows = await sql.query(`select * from ${table} order by client, source limit 500 offset $1`, [moved]);
    if (!rows.length) break;
    const { error } = await supabase.from(table).upsert(rows, { onConflict: CONFLICTS[table] });
    if (error) throw new Error(`${table}: ${error.message}`);
    moved += rows.length;
    process.stdout.write(`\r${table}: ${moved}/${count}`);
  }
  process.stdout.write('\n');
  const { count: target, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  if (target !== count) throw new Error(`${table} validation failed: Neon=${count}, Supabase=${target}`);
  return count;
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error('Missing Supabase configuration');
const sql = getSql();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
for (const slug of ['storylane', 'skai', 'lookmedia']) {
  await supabase.from('clients').upsert({ slug, name: slug === 'storylane' ? 'Storylane.io' : slug === 'skai' ? 'Skai.io' : 'LookMedia' }, { onConflict: 'slug', ignoreDuplicates: true });
}
const totals = {};
for (const table of TABLES) totals[table] = await migrateTable(sql, supabase, table);
console.log('Portal migration verified:', totals);
