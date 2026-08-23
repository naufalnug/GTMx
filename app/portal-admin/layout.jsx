import '../portal/portal.css';
import './admin.css';
export const metadata = { title: 'Portal administration · GTMx', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function AdminLayout({ children }) { return <>{children}<a className="admin-provision-link" href="/portal-admin/provision">Provision existing login</a></>; }
