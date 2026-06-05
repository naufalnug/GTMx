import './DashboardHeader.css';

export default function DashboardHeader({ client, updatedAt, campaignCount }) {
  const updated = new Date(updatedAt);
  const updatedLabel = updated.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <header className="dh dark">
      <div className="wrap dh__inner">
        <div className="dh__brand">
          <a href="/" className="dh__gtmx">
            GTMx<span className="dh__gtmx-tail">_</span>
          </a>
          <span className="dh__divider" aria-hidden="true" />
          <span className="dh__for">
            <span className="dh__for-label">// outreach_report</span>
            <span className="dh__for-text">
              for <em>{client.name}</em>
            </span>
          </span>
        </div>

        <div className="dh__meta">
          <div className="dh__meta-row">
            <span className="dh__meta-label">Workspace</span>
            <span className="dh__meta-value">{client.name}</span>
          </div>
          <div className="dh__meta-row">
            <span className="dh__meta-label">Active campaigns</span>
            <span className="dh__meta-value">{campaignCount}</span>
          </div>
          <div className="dh__meta-row">
            <span className="dh__meta-label">Updated</span>
            <span className="dh__meta-value">{updatedLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
