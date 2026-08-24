import Link from "next/link";
import { logoutAction } from "../actions";
import { getPortalViewer } from "../../../lib/portalAuth";
import { getPortalNotifications } from "../../../lib/portalData";
import Icon from "./Icon";
import NotificationBell from "./NotificationBell";

const nav = [
  ["Overview", "/portal", "overview"],
  ["Positive leads", "/portal/leads", "leads"],
  ["Email copy", "/portal/copy", "copy"],
  ["Master inbox", "/portal/inbox", "inbox"],
];


export default async function PortalShell({
  client,
  active,
  preview = false,
  children,
}) {
  const initial = client.name.charAt(0).toUpperCase();
  // Rendered on every portal page, so this is 3-4 indexed queries per page load.
  // Failing here must not take down the page the bell is decorating.
  const viewer = await getPortalViewer().catch(() => null);
  const notifications = await getPortalNotifications(client.slug, {
    userId: preview ? null : viewer?.id,
  }).catch(() => ({ items: [], unreadCount: 0, latestId: 0, hasMore: false }));
  const withPreview = (href) =>
    preview ? `${href}?client=${encodeURIComponent(client.slug)}` : href;
  return (
    <div
      className="portal-app"
      style={{ "--client-accent": client.brand_color || "#E8552B" }}
    >
      <aside className="portal-sidebar">
        <div className="sidebar-top">
          <Link className="portal-logo" href={withPreview("/portal")}>
            GTM<span>x</span>
          </Link>
          <NotificationBell {...notifications} readOnly={preview} />
        </div>
        <nav aria-label="Client portal">
          {nav.map(([label, href, id]) => (
            <Link
              key={id}
              href={withPreview(href)}
              className={active === id ? "is-active" : ""}
            >
              <Icon name={id} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-client">
          <span className="client-avatar">{initial}</span>
          <span>
            <strong>{client.name}</strong>
            <small>Client workspace</small>
          </span>
        </div>
        <form action={logoutAction}>
          <button className="sidebar-signout" type="submit">
            Sign out <span aria-hidden="true">↗</span>
          </button>
        </form>
      </aside>
      <div className="portal-main">
        {preview ? (
          <div className="portal-preview-bar">
            <span>Admin preview · Viewing {client.name}</span>
            <Link href="/portal-admin">Back to admin</Link>
          </div>
        ) : null}
        <header className="portal-mobile-header">
          <Link className="portal-logo" href={withPreview("/portal")}>
            GTM<span>x</span>
          </Link>
          <span>{client.name}</span>
          <NotificationBell {...notifications} readOnly={preview} />
        </header>
        <nav
          className="portal-mobile-nav"
          aria-label="Client portal mobile navigation"
        >
          {nav.map(([label, href, id]) => (
            <Link
              key={id}
              href={withPreview(href)}
              className={active === id ? "is-active" : ""}
            >
              <Icon name={id} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
