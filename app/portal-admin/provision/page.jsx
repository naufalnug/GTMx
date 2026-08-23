import { requirePortalAdmin } from '../../../lib/portalAuth';
import { createAdminClient } from '../../../lib/supabase/admin';
import { provisionClientAccountAction } from '../actions';

export default async function ProvisionAccountPage() {
  await requirePortalAdmin();
  const admin = createAdminClient();
  const [{ data: clients }, { data: memberships }] = await Promise.all([
    admin.from('clients').select('slug,name').order('name'),
    admin.from('portal_memberships').select('client_slug'),
  ]);
  const provisioned = new Set((memberships ?? []).map((item) => item.client_slug));
  const available = (clients ?? []).filter((client) => !provisioned.has(client.slug));
  return <main className="admin-app"><div className="admin-content admin-provision-page"><a href="/portal-admin">← Back to clients</a><span className="portal-kicker">Existing workspace</span><h1>Provision shared login</h1><p>Create the first portal credential for a client migrated from the old dashboard.</p>{available.length ? <form action={provisionClientAccountAction} className="admin-form"><div className="admin-form-grid"><label>Client<select name="slug" required>{available.map((client) => <option value={client.slug} key={client.slug}>{client.name}</option>)}</select></label><label>Shared login email<input name="email" type="email" required /></label><label className="admin-form-wide">Temporary password<input name="password" type="password" minLength="10" required /></label></div><button className="portal-button" type="submit">Create shared login</button></form> : <div className="portal-success">Every client already has a portal login.</div>}</div></main>;
}
