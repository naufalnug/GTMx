'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePortalAdmin } from '../../lib/portalAuth';
import { createAdminClient } from '../../lib/supabase/admin';
import { encryptPortalValue } from '../../lib/portalCrypto';

function cleanSlug(value) { return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''); }
function value(form, key) { return String(form.get(key) ?? '').trim(); }
async function audit(admin, actor, client, event, detail = {}) { await admin.from('portal_audit_events').insert({ actor_id: actor, client_slug: client || null, event_type: event, detail }); }

export async function createClientAction(formData) {
  const viewer = await requirePortalAdmin(); const admin = createAdminClient();
  const slug = cleanSlug(formData.get('slug')); const name = value(formData, 'name'); const email = value(formData, 'email').toLowerCase(); const password = value(formData, 'password');
  if (!slug || !name || !email || password.length < 10) redirect('/portal-admin?error=invalid');
  const inboxUrl = value(formData, 'inbox_url');
  const { error: clientError } = await admin.from('clients').insert({ slug, name, brand_color: value(formData, 'brand_color') || '#E8552B', default_source: value(formData, 'default_source') || 'all', workspace_id: value(formData, 'workspace_id') || null, inbox_url_ciphertext: inboxUrl ? encryptPortalValue(inboxUrl) : null });
  if (clientError) redirect(`/portal-admin?error=${encodeURIComponent(clientError.code || 'client')}`);
  const { data: auth, error: authError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { portal_role: 'client' } });
  if (authError) { await admin.from('clients').delete().eq('slug', slug); redirect('/portal-admin?error=account'); }
  const { error: memberError } = await admin.from('portal_memberships').insert({ user_id: auth.user.id, client_slug: slug });
  if (memberError) { await admin.auth.admin.deleteUser(auth.user.id); await admin.from('clients').delete().eq('slug', slug); redirect('/portal-admin?error=membership'); }
  await audit(admin, viewer.id, slug, 'client.created', { account_email: email });
  revalidatePath('/portal-admin'); redirect('/portal-admin?created=1');
}

export async function updateClientAction(formData) {
  const viewer = await requirePortalAdmin(); const admin = createAdminClient(); const slug = cleanSlug(formData.get('slug'));
  const changes = { name: value(formData, 'name'), brand_color: value(formData, 'brand_color') || '#E8552B', default_source: value(formData, 'default_source') || 'all', workspace_id: value(formData, 'workspace_id') || null, updated_at: new Date().toISOString() };
  const inboxUrl = value(formData, 'inbox_url'); if (inboxUrl) changes.inbox_url_ciphertext = encryptPortalValue(inboxUrl);
  const { error } = await admin.from('clients').update(changes).eq('slug', slug); if (error) redirect('/portal-admin?error=update');
  await audit(admin, viewer.id, slug, 'client.updated', { fields: Object.keys(changes).filter((key) => key !== 'inbox_url_ciphertext') });
  revalidatePath('/portal-admin'); redirect('/portal-admin?updated=1');
}

export async function toggleClientAction(formData) {
  const viewer = await requirePortalAdmin(); const admin = createAdminClient(); const slug = cleanSlug(formData.get('slug')); const active = formData.get('active') === 'true';
  await admin.from('clients').update({ active, updated_at: new Date().toISOString() }).eq('slug', slug);
  await audit(admin, viewer.id, slug, active ? 'client.activated' : 'client.deactivated'); revalidatePath('/portal-admin');
}

export async function sendClientResetAction(formData) {
  const viewer = await requirePortalAdmin(); const admin = createAdminClient(); const slug = cleanSlug(formData.get('slug'));
  const { data: membership } = await admin.from('portal_memberships').select('user_id').eq('client_slug', slug).maybeSingle();
  if (!membership) redirect('/portal-admin?error=account');
  const { data: user } = await admin.auth.admin.getUserById(membership.user_id); const email = user?.user?.email;
  if (email) { const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; await admin.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/confirm?next=/portal/reset-password` }); await audit(admin, viewer.id, slug, 'account.recovery_requested'); }
  redirect('/portal-admin?reset=sent');
}

export async function provisionClientAccountAction(formData) {
  const viewer = await requirePortalAdmin();
  const admin = createAdminClient();
  const slug = cleanSlug(formData.get('slug'));
  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');
  if (!email || password.length < 10) redirect('/portal-admin?error=invalid');
  const { data: existing } = await admin.from('portal_memberships').select('user_id').eq('client_slug', slug).maybeSingle();
  if (existing) redirect('/portal-admin?error=account-exists');
  const { data: auth, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { portal_role: 'client' } });
  if (error) redirect('/portal-admin?error=account');
  const { error: memberError } = await admin.from('portal_memberships').insert({ user_id: auth.user.id, client_slug: slug });
  if (memberError) {
    await admin.auth.admin.deleteUser(auth.user.id);
    redirect('/portal-admin?error=membership');
  }
  await audit(admin, viewer.id, slug, 'account.provisioned', { account_email: email });
  revalidatePath('/portal-admin');
  redirect('/portal-admin?created=account');
}
