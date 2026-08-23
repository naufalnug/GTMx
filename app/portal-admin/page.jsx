import Link from "next/link";
import { requirePortalAdmin } from "../../lib/portalAuth";
import { createAdminClient } from "../../lib/supabase/admin";
import { logoutAction } from "../portal/actions";
import {
  createClientAction,
  sendClientResetAction,
  toggleClientAction,
  updateClientAction,
} from "./actions";

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Never";
}

export default async function PortalAdminPage({ searchParams }) {
  const viewer = await requirePortalAdmin();
  const query = await searchParams;
  const admin = createAdminClient();
  const [{ data: clients, error }, { data: memberships }] = await Promise.all([
    admin.from("portal_clients").select("*").order("created_at"),
    admin.from("portal_memberships").select("client_slug,user_id"),
  ]);
  if (error) throw error;
  const accounts = new Map();
  for (const member of memberships ?? []) {
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    accounts.set(
      member.client_slug,
      data?.user?.email ?? "Account unavailable",
    );
  }
  return (
    <main className="admin-app">
      <header className="admin-topbar">
        <a className="portal-logo" href="/portal-admin">
          GTM<span>x</span> <small>Portal admin</small>
        </a>
        <div>
          <span>{viewer.email}</span>
          <form action={logoutAction}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <div className="admin-content">
        <header className="admin-heading">
          <div>
            <span className="portal-kicker">Workspace operations</span>
            <h1>Client access</h1>
            <p>
              Provision accounts, configure inboxes, and monitor campaign sync
              health.
            </p>
          </div>
          <details className="admin-create">
            <summary>+ Add client</summary>
            <form action={createClientAction} className="admin-form">
              <h2>New client workspace</h2>
              <div className="admin-form-grid">
                <label>
                  Client name
                  <input name="name" required />
                </label>
                <label>
                  URL slug
                  <input name="slug" pattern="[a-z0-9-]+" required />
                </label>
                <label>
                  Shared login email
                  <input name="email" type="email" required />
                </label>
                <label>
                  Temporary password
                  <input
                    name="password"
                    type="password"
                    minLength="10"
                    required
                  />
                </label>
                <label>
                  Brand color
                  <input
                    name="brand_color"
                    type="color"
                    defaultValue="#E8552B"
                  />
                </label>
                <label>
                  Default source
                  <select name="default_source" defaultValue="all">
                    <option value="all">All sources</option>
                    <option value="gtmx">GTMx</option>
                    <option value="dedi">Dedi</option>
                  </select>
                </label>
                <label>
                  EmailBison workspace ID
                  <input name="workspace_id" inputMode="numeric" />
                </label>
                <label className="admin-form-wide">
                  Client-specific inbox URL
                  <input name="inbox_url" type="url" placeholder="https://…" />
                </label>
              </div>
              <button className="portal-button" type="submit">
                Create workspace
              </button>
            </form>
          </details>
        </header>
        {query?.error ? (
          <p className="portal-alert">
            The operation could not be completed ({query.error}). Check the
            values and try again.
          </p>
        ) : null}
        {query?.created ? (
          <p className="portal-success">
            Client workspace and shared login created.
          </p>
        ) : null}
        {query?.updated ? (
          <p className="portal-success">Client settings updated.</p>
        ) : null}
        {query?.reset ? (
          <p className="portal-success">Password recovery email requested.</p>
        ) : null}
        <section className="admin-stats">
          <article>
            <span>Clients</span>
            <strong>{clients.length}</strong>
          </article>
          <article>
            <span>Active</span>
            <strong>{clients.filter((client) => client.active).length}</strong>
          </article>
          <article>
            <span>Inbox connected</span>
            <strong>
              {clients.filter((client) => client.inbox_url_ciphertext).length}
            </strong>
          </article>
          <article>
            <span>Sync errors</span>
            <strong>
              {clients.filter((client) => client.sync_error).length}
            </strong>
          </article>
        </section>
        <section className="admin-client-list">
          {clients.map((client) => (
            <article className="admin-client" key={client.slug}>
              <header>
                <span
                  className="admin-client-avatar"
                  style={{ background: client.brand_color }}
                >
                  {client.name.charAt(0)}
                </span>
                <div>
                  <h2>{client.name}</h2>
                  <p>
                    {accounts.get(client.slug)} · /{client.slug}
                  </p>
                </div>
                <span
                  className={`admin-state ${client.active ? "is-active" : ""}`}
                >
                  {client.active ? "Active" : "Inactive"}
                </span>
              </header>
              <div className="admin-client-health">
                <span>
                  <small>Last synced</small>
                  {formatDate(client.last_synced_at)}
                </span>
                <span>
                  <small>Inbox</small>
                  {client.inbox_url_ciphertext ? "Connected" : "Not configured"}
                </span>
                <span>
                  <small>Source</small>
                  {client.default_source}
                </span>
                {client.sync_error ? (
                  <span className="has-error">
                    <small>Sync issue</small>
                    {client.sync_error}
                  </span>
                ) : null}
              </div>
              <details>
                <summary>Edit workspace</summary>
                <form action={updateClientAction} className="admin-form">
                  <input type="hidden" name="slug" value={client.slug} />
                  <div className="admin-form-grid">
                    <label>
                      Client name
                      <input name="name" defaultValue={client.name} required />
                    </label>
                    <label>
                      Brand color
                      <input
                        name="brand_color"
                        type="color"
                        defaultValue={client.brand_color}
                      />
                    </label>
                    <label>
                      Default source
                      <select
                        name="default_source"
                        defaultValue={client.default_source}
                      >
                        <option value="all">All sources</option>
                        <option value="gtmx">GTMx</option>
                        <option value="dedi">Dedi</option>
                      </select>
                    </label>
                    <label>
                      EmailBison workspace ID
                      <input
                        name="workspace_id"
                        defaultValue={client.workspace_id ?? ""}
                      />
                    </label>
                    <label className="admin-form-wide">
                      Replace inbox URL
                      <input
                        name="inbox_url"
                        type="url"
                        placeholder={
                          client.inbox_url_ciphertext
                            ? "Leave blank to keep connected URL"
                            : "https://…"
                        }
                      />
                    </label>
                  </div>
                  <button className="portal-button" type="submit">
                    Save changes
                  </button>
                </form>
              </details>
              <footer>
                <Link
                  className="admin-view-client"
                  href={`/portal?client=${encodeURIComponent(client.slug)}`}
                >
                  View client portal <span aria-hidden="true">↗</span>
                </Link>
                <form action={sendClientResetAction}>
                  <input type="hidden" name="slug" value={client.slug} />
                  <button type="submit">Send password reset</button>
                </form>
                <form action={toggleClientAction}>
                  <input type="hidden" name="slug" value={client.slug} />
                  <input
                    type="hidden"
                    name="active"
                    value={String(!client.active)}
                  />
                  <button
                    className={!client.active ? "activate" : "danger"}
                    type="submit"
                  >
                    {client.active
                      ? "Deactivate workspace"
                      : "Reactivate workspace"}
                  </button>
                </form>
              </footer>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
