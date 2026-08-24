import { requirePortalClient } from "../../../lib/portalAuth";
import { getClientInbox } from "../../../lib/portalData";
import PortalShell from "../_components/PortalShell";
import InboxFrame from "../_components/InboxFrame";

export default async function InboxPage({ searchParams }) {
  const query = await searchParams;
  const viewer = await requirePortalClient(query?.client);
  let inbox = null;
  try {
    inbox = await getClientInbox(viewer.client.slug);
  } catch (error) {
    console.error("Inbox configuration failed", error);
  }
  return (
    <PortalShell client={viewer.client} active="inbox" preview={viewer.isPreview}>
      <main className="portal-content portal-content--inbox">
        <header className="portal-page-head inbox-head">
          <div>
            <span className="portal-kicker">Reply without switching tools</span>
            <h1>Master inbox</h1>
            <p>
              Review conversations and respond from your connected inbox, without
              leaving the portal.
            </p>
          </div>
        </header>
        <InboxFrame inbox={inbox} />
      </main>
    </PortalShell>
  );
}
