import { requirePortalClient } from "../../../lib/portalAuth";
import {
  getPortalDashboard,
  getPortalSources,
  resolvePortalSource,
} from "../../../lib/portalData";
import { resolvePeriod } from "../../../lib/period";
import PortalShell from "../_components/PortalShell";
import PortalFilters from "../_components/PortalFilters";
import LeadSearch from "../_components/LeadSearch";

export default async function LeadsPage({ searchParams }) {
  const query = await searchParams;
  const viewer = await requirePortalClient(query?.client);
  const sources = await getPortalSources(viewer.client.slug);
  const source = resolvePortalSource(
    query?.source,
    sources,
    viewer.client.default_source,
  );
  const period = resolvePeriod({ ...query, period: query?.period || "90d" });
  const data = await getPortalDashboard(viewer.client.slug, period, source);
  return (
    <PortalShell client={viewer.client} active="leads" preview={viewer.isPreview}>
      <main className="portal-content">
        <header className="portal-page-head">
          <div>
            <span className="portal-kicker">Pipeline signals</span>
            <h1>Positive leads</h1>
            <p>
              People who replied positively and are ready for the next
              conversation.
            </p>
          </div>
          <PortalFilters period={period} sources={sources} source={source} />
        </header>
        <LeadSearch leads={data.positiveReplies} />
      </main>
    </PortalShell>
  );
}
