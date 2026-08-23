import Link from "next/link";
import { logoutAction } from "../actions";

const nav = [
  ["Overview", "/portal", "overview"],
  ["Positive leads", "/portal/leads", "leads"],
  ["Email copy", "/portal/copy", "copy"],
  ["Master inbox", "/portal/inbox", "inbox"],
];

function Icon({ name }) {
  const paths = {
    overview: (
      <>
        <path d="M4 13h6V4H4zM14 20h6V11h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />
      </>
    ),
    leads: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m16 11 2 2 4-4" />
      </>
    ),
    copy: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="m4 13 4-4 4 4 4-4 4 4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default function PortalShell({
  client,
  active,
  preview = false,
  children,
}) {
  const initial = client.name.charAt(0).toUpperCase();
  const withPreview = (href) =>
    preview ? `${href}?client=${encodeURIComponent(client.slug)}` : href;
  return (
    <div
      className="portal-app"
      style={{ "--client-accent": client.brand_color || "#E8552B" }}
    >
      <aside className="portal-sidebar">
        <Link className="portal-logo" href={withPreview("/portal")}>
          GTM<span>x</span>
        </Link>
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
