'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { createAdminClient } from '../../lib/supabase/admin';

export async function loginAction(formData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect('/portal/login?error=credentials');

  const role = data.user?.app_metadata?.portal_role;
  const admin = createAdminClient();
  const { data: membership } = await admin.from('portal_memberships').select('client_slug').eq('user_id', data.user.id).maybeSingle();
  await admin.from('portal_audit_events').insert({ actor_id: data.user.id, client_slug: membership?.client_slug ?? null, event_type: 'account.signed_in', detail: {} });
  redirect(role === 'admin' ? '/portal-admin' : '/portal');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/portal/login');
}

export async function requestResetAction(formData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/confirm?next=/portal/reset-password` });
  redirect('/portal/login?reset=sent');
}

export async function updatePasswordAction(formData) {
  const password = String(formData.get('password') ?? '');
  if (password.length < 10) redirect('/portal/reset-password?error=weak');
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect('/portal/reset-password?error=failed');
  redirect('/portal');
}
