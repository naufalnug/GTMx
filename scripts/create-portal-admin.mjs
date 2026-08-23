/** Bootstrap a named GTMx administrator. Usage: npm run portal:create-admin -- admin@gtmx.run */
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2]?.trim().toLowerCase();
const password = process.env.PORTAL_ADMIN_INITIAL_PASSWORD;
if (!email || !password || password.length < 12) throw new Error('Pass an email and set PORTAL_ADMIN_INITIAL_PASSWORD (12+ characters).');
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing Supabase configuration. Load .env.local before running this script.');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { portal_role: 'admin' } });
if (error) throw error;
console.log(`Created named portal admin ${data.user.email}. Remove PORTAL_ADMIN_INITIAL_PASSWORD from the environment now.`);
