import { notFound, redirect } from 'next/navigation';
import { getClient } from '../../../../lib/clients';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Client portal · GTMx',
  robots: { index: false, follow: false },
};

export default async function LegacyDashboardRedirect({ params }) {
  const { client: slug, token } = await params;
  const client = getClient(slug);
  if (!client || token !== client.token) notFound();
  redirect('/portal/login');
}
