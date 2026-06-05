import { notFound } from 'next/navigation';
import { getClient } from '../../../../lib/clients';
import { loadDashboardData } from '../../../../lib/emailbison';
import { deriveInsights } from '../../../../lib/dashboardInsights';
import DashboardHeader from '../../../../components/dashboard/DashboardHeader';
import MetricsBar from '../../../../components/dashboard/MetricsBar';
import CampaignTable from '../../../../components/dashboard/CampaignTable';
import Observations from '../../../../components/dashboard/Observations';
import CampaignCopy from '../../../../components/dashboard/CampaignCopy';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { client: slug } = await params;
  const client = getClient(slug);
  const title = client
    ? `${client.name} — Outreach report · GTMx`
    : 'GTMx';
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export default async function DashboardPage({ params }) {
  const { client: slug, token } = await params;
  const client = getClient(slug);
  if (!client || token !== client.token) {
    notFound();
  }

  const baseUrl = process.env.EMAILBISON_INSTANCE_URL;
  if (!baseUrl) {
    notFound();
  }

  let data;
  try {
    data = await loadDashboardData({ baseUrl, apiKey: client.apiKey });
  } catch (err) {
    console.error('Dashboard load failed', err);
    return (
      <main className="dashboard-error">
        <div className="wrap" style={{ padding: '120px 0' }}>
          <span className="eyebrow--code">// error</span>
          <h1 className="h2" style={{ marginTop: 12 }}>
            We couldn't load this report right now.
          </h1>
          <p className="lede" style={{ marginTop: 16 }}>
            EmailBison didn't respond in time. The page caches for 5 minutes — try a refresh in a moment.
          </p>
        </div>
      </main>
    );
  }

  const insights = deriveInsights(data.campaigns);
  const updatedAt = new Date().toISOString();

  return (
    <main>
      <DashboardHeader
        client={client}
        updatedAt={updatedAt}
        campaignCount={data.campaigns.length}
      />
      <MetricsBar totals={data.totals} />
      <CampaignTable campaigns={data.campaigns} />
      <Observations insights={insights} />
      <CampaignCopy campaigns={data.campaigns} />
    </main>
  );
}
