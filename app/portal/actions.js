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

/**
 * Mark every notification the viewer has seen as read.
 *
 * `throughId` comes from a hidden input rendered with the page, so this marks exactly
 * what was on screen — not anything that arrived between render and click.
 */
export async function markAllNotificationsReadAction(formData) {
  const { requirePortalClient } = await import('../../lib/portalAuth');
  const { revalidatePath } = await import('next/cache');
  const viewer = await requirePortalClient(String(formData.get('client') ?? '').trim() || undefined);
  // An admin previewing a client must never clear that client's badge — and has no
  // membership row to hold a watermark anyway.
  if (viewer.isPreview) return;

  const throughId = Number(formData.get('throughId') ?? 0);
  if (!Number.isFinite(throughId) || throughId <= 0) return;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from('portal_memberships')
    .select('notifications_read_through_id')
    .eq('user_id', viewer.id)
    .maybeSingle();
  // Never move the watermark backwards; a stale tab could post an older id.
  const next = Math.max(Number(membership?.notifications_read_through_id ?? 0), throughId);
  await admin
    .from('portal_memberships')
    .update({ notifications_read_through_id: next })
    .eq('user_id', viewer.id);
  await admin.from('portal_audit_events').insert({
    actor_id: viewer.id,
    client_slug: viewer.client.slug,
    event_type: 'notifications.marked_read',
    detail: { through_id: next },
  });
  revalidatePath('/portal', 'layout');
}

/** Dismiss one notification without burying everything older than it. */
export async function markNotificationReadAction(formData) {
  const { requirePortalClient } = await import('../../lib/portalAuth');
  const { revalidatePath } = await import('next/cache');
  const viewer = await requirePortalClient(String(formData.get('client') ?? '').trim() || undefined);
  if (viewer.isPreview) return;

  const notificationId = Number(formData.get('notificationId') ?? 0);
  if (!Number.isFinite(notificationId) || notificationId <= 0) return;

  const admin = createAdminClient();
  // Confirm the notification belongs to this viewer's client before writing. Leaks
  // nothing either way, but a crafted form should be rejected rather than obeyed.
  const { data: row } = await admin
    .from('portal_notifications')
    .select('id, client')
    .eq('id', notificationId)
    .maybeSingle();
  if (!row || row.client !== viewer.client.slug) return;

  await admin
    .from('portal_notification_reads')
    .upsert(
      { user_id: viewer.id, notification_id: notificationId, client: row.client },
      { onConflict: 'user_id,notification_id', ignoreDuplicates: true }
    );
  revalidatePath('/portal', 'layout');
}
