'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { createAdminClient } from '../../lib/supabase/admin';

// Ignore a manual sync within this window of the last one — a full workspace pull
// takes tens of seconds and repeat clicks would stack them up.
const COOLDOWN_MS = 60_000;

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

/**
 * Manual "Sync data" — pulls the viewer's own client fresh from EmailBison.
 *
 * Scoped to the viewer's client (admins previewing sync the client they're
 * previewing), so a client can never trigger someone else's sync. A short
 * cooldown keeps an impatient click from queueing several full pulls of the
 * same workspace on top of each other.
 */
export async function syncClientDataAction(formData) {
  const { requirePortalClient } = await import('../../lib/portalAuth');
  const { runSync } = await import('../../lib/sync');
  const { revalidatePath } = await import('next/cache');

  const previewSlug = String(formData.get('client') ?? '').trim() || undefined;
  const viewer = await requirePortalClient(previewSlug);
  const slug = viewer.client.slug;
  const back = previewSlug ? `/portal?client=${encodeURIComponent(previewSlug)}` : '/portal';

  const admin = createAdminClient();
  const { data: row } = await admin.from('clients').select('last_synced_at').eq('slug', slug).maybeSingle();
  const since = row?.last_synced_at ? Date.now() - new Date(row.last_synced_at).getTime() : Infinity;
  if (since < COOLDOWN_MS) redirect(`${back}${back.includes('?') ? '&' : '?'}sync=recent`);

  let status = 'done';
  try {
    await runSync([slug], { log: (message) => console.log(`[manual sync] ${message}`) });
  } catch (error) {
    console.error('Manual sync failed', error);
    status = 'failed';
  }
  await admin.from('portal_audit_events').insert({
    actor_id: viewer.id, client_slug: slug, event_type: 'client.sync_requested', detail: { status },
  });
  revalidatePath('/portal');
  redirect(`${back}${back.includes('?') ? '&' : '?'}sync=${status}`);
}
