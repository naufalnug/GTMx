import { notFound } from 'next/navigation';
import { getClient } from '../../../../lib/clients';
import { loadDashboardData, getClientSources, resolveSource } from '../../../../lib/dashboardData';
import { getEmailedCompanies } from '../../../../lib/companies';
import { resolvePeriod } from '../../../../lib/period';
import { deriveInsights } from '../../../../lib/dashboardInsights';
import '../../../../components/dashboard/theme.css';
import DashboardHeader from '../../../../components/dashboard/DashboardHeader';
import MetricsBar from '../../../../components/dashboard/MetricsBar';
import SectionNav from '../../../../components/dashboard/SectionNav';
import PositiveReplies from '../../../../components/dashboard/PositiveReplies';
import CampaignTable from '../../../../components/dashboard/CampaignTable';
import CompaniesTable from '../../../../components/dashboard/CompaniesTable';
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

export default async function DashboardPage({ params, searchParams }) {
  const { client: slug, token } = await params;
  const client = getClient(slug);
  if (!client || token !== client.token) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const period = resolvePeriod(sp);
  const requestedSource = typeof sp.source === 'string' ? sp.source : undefined;

  let data;
  let companies;
  let sources;
  let source;
  try {
    sources = await getClientSources(slug);
    source = resolveSource(requestedSource, sources, client.defaultSource);
    [data, companies] = await Promise.all([
      loadDashboardData(slug, period, source),
      getEmailedCompanies(slug, source),
    ]);
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
            The data store didn't respond in time. The page caches for 5 minutes — try a refresh in a moment.
          </p>
        </div>
      </main>
    );
  }

  const insights = deriveInsights(data.campaigns);
  const updatedAt = new Date().toISOString();

  return (
    <main className="dash">
      <DashboardHeader
        client={client}
        updatedAt={updatedAt}
        campaignCount={data.campaigns.length}
        period={period}
      />
      <MetricsBar totals={data.totals} period={period} sources={sources} source={source} />
      <SectionNav />
      <PositiveReplies replies={data.positiveReplies} />
      <CampaignTable campaigns={data.campaigns} />
      <CompaniesTable companies={companies.companies} generatedAt={companies.generatedAt} />
      <Observations insights={insights} />
      <CampaignCopy campaigns={data.campaigns} />
    </main>
  );
}
