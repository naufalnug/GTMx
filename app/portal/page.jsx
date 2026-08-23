import { requirePortalClient } from "../../lib/portalAuth";
import {
  getPortalDashboard,
  getPortalSources,
  resolvePortalSource,
} from "../../lib/portalData";
import { resolvePeriod } from "../../lib/period";
import PortalShell from "./_components/PortalShell";
import PortalFilters from "./_components/PortalFilters";
import TrendChart from "./_components/TrendChart";

function int(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}
function pct(value) {
  return `${Number(value).toFixed(1)}%`;
}

/**
 * The ratio counts every contact emailed, including those still mid-sequence, so it
 * reads pessimistically early on and improves as sequences finish. This note says how
 * far through that is, so the number isn't mistaken for a settled figure.
 */
function sequenceNote({ emailed, interested, fullySequenced, sequenceLength }) {
  if (!interested) return `${int(emailed)} emailed · no interested leads yet`;
  if (!sequenceLength || !emailed) return `${int(emailed)} emailed · ${int(interested)} interested`;
  const share = (fullySequenced / emailed) * 100;
  return `${share < 1 ? "<1" : Math.round(share)}% through all ${sequenceLength} steps`;
}

export default async function PortalOverview({ searchParams }) {
  const query = await searchParams;
  const viewer = await requirePortalClient(query?.client);
  const sources = await getPortalSources(viewer.client.slug);
  const source = resolvePortalSource(
    query?.source,
    sources,
    viewer.client.default_source,
  );
  const period = resolvePeriod({ ...query, period: query?.period || "30d" });
  const data = await getPortalDashboard(viewer.client.slug, period, source);
  return (
    <PortalShell client={viewer.client} active="overview" preview={viewer.isPreview}>
      <main className="portal-content">
        <header className="portal-page-head">
          <div>
            <span className="portal-kicker">Campaign control room</span>
            <h1>Here’s what’s moving.</h1>
            <p>
              Live outreach performance for {viewer.client.name}, synced from
              EmailBison.
            </p>
          </div>
          <PortalFilters period={period} sources={sources} source={source} />
        </header>
        <section className="metric-strip" aria-label="Campaign totals">
          <article>
            <span>Emails sent</span>
            <strong>{int(data.totals.sent)}</strong>
            <small>Selected period</small>
          </article>
          <article>
            <span>Reply rate</span>
            <strong>{pct(data.totals.replyRate)}</strong>
            <small>{int(data.totals.replies)} total replies</small>
          </article>
          <article className="metric-positive">
            <span>Positive leads</span>
            <strong>{int(data.totals.interested)}</strong>
            <small>Marked interested</small>
          </article>
          <article>
            <span>Bounce rate</span>
            <strong>{pct(data.totals.bounceRate)}</strong>
            <small>{int(data.totals.bounced)} bounced</small>
          </article>
          <article>
            <span>Contacts emailed</span>
            <strong>{int(data.contacts.emailed)}</strong>
            <small>All time · unique people</small>
          </article>
          <article>
            <span>Current contact → lead ratio</span>
            <strong>
              {data.contacts.contactsPerLead
                ? `1 in ${int(data.contacts.contactsPerLead)}`
                : "—"}
            </strong>
            <small>{sequenceNote(data.contacts)}</small>
          </article>
        </section>
        <section className="portal-panel performance-panel">
          <header>
            <div>
              <h2>Sending activity</h2>
              <p>Daily volume across the selected reporting window.</p>
            </div>
            <span className="period-badge">{period.label}</span>
          </header>
          <TrendChart points={data.trend} />
        </section>
        <section className="portal-panel campaign-panel">
          <header>
            <div>
              <h2>Campaign performance</h2>
              <p>Every campaign with activity in this period.</p>
            </div>
            <span>{data.campaigns.length} campaigns</span>
          </header>
          {data.campaigns.length ? (
            <div className="portal-table-wrap">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Replies</th>
                    <th>Positive</th>
                    <th>Reply rate</th>
                    <th>Bounce rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <strong>{campaign.name}</strong>
                        <small>{campaign.steps.length} sequence steps</small>
                      </td>
                      <td>
                        <span className="status-pill">{campaign.status}</span>
                      </td>
                      <td>{int(campaign.sent)}</td>
                      <td>{int(campaign.replies)}</td>
                      <td className="positive-number">
                        {int(campaign.interested)}
                      </td>
                      <td>{pct(campaign.replyRate)}</td>
                      <td>{pct(campaign.bounceRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="portal-empty">
              <span>↗</span>
              <h2>No campaign activity</h2>
              <p>Try another reporting period or wait for the next sync.</p>
            </div>
          )}
        </section>
      </main>
    </PortalShell>
  );
}
