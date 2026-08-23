'use client';

import { useState } from 'react';

export default function InboxFrame({ url }) {
  const [loaded, setLoaded] = useState(false);
  if (!url) return <div className="portal-empty inbox-empty"><span>↗</span><h2>Inbox connection pending</h2><p>GTMx has not connected an inbox to this workspace yet.</p></div>;
  return <div className="inbox-frame"><div className="inbox-frame-bar"><span><i /> Secure EmailBison workspace</span><a href={url} target="_blank" rel="noopener noreferrer">Open in new tab ↗</a></div>{!loaded ? <div className="inbox-loading"><span /><p>Connecting to your master inbox…</p></div> : null}<iframe src={url} title="EmailBison master inbox" onLoad={() => setLoaded(true)} allow="clipboard-read; clipboard-write" referrerPolicy="strict-origin-when-cross-origin" /></div>;
}
