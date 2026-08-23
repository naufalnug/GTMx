import { requirePortalClient } from "../../../lib/portalAuth";
import {
  getPortalDashboard,
  getPortalSources,
  resolvePortalSource,
} from "../../../lib/portalData";
import { resolvePeriod } from "../../../lib/period";
import PortalShell from "../_components/PortalShell";
import CopyBrowser from "../_components/CopyBrowser";

export default async function CopyPage({ searchParams }) {
  const query = await searchParams;
  const viewer = await requirePortalClient(query?.client);
  const sources = await getPortalSources(viewer.client.slug);
  const source = resolvePortalSource(
    query?.source,
    sources,
    viewer.client.default_source,
  );
  const data = await getPortalDashboard(
    viewer.client.slug,
    resolvePeriod({ period: "all" }),
    source,
  );
  return (
    <PortalShell client={viewer.client} active="copy" preview={viewer.isPreview}>
      <main className="portal-content">
        <header className="portal-page-head">
          <div>
            <span className="portal-kicker">What prospects see</span>
            <h1>Email copy</h1>
            <p>
              Review every live subject line, message, delay, and threaded
              follow-up.
            </p>
          </div>
        </header>
        <CopyBrowser campaigns={data.campaigns} />
      </main>
    </PortalShell>
  );
}
