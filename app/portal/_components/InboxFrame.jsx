'use client';

import { useEffect, useRef, useState } from 'react';

const MI_ORIGIN = 'https://app.masterinbox.com';

/**
 * MasterInbox signs the embed in over postMessage: the iframe emits `ready`, the
 * parent replies with `login`. Both sides are origin-pinned — we only answer
 * messages whose origin is MasterInbox, and only ever post to that origin, so a
 * hostile frame can neither impersonate the handshake nor receive the payload.
 */
function useMasterInboxLogin(frameRef, credentials, onSignedIn) {
  useEffect(() => {
    if (!credentials?.email || !credentials?.password) return undefined;
    function onMessage(event) {
      if (event.origin !== MI_ORIGIN) return;
      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!data || typeof data !== 'object' || data.action !== 'ready') return;
      frameRef.current?.contentWindow?.postMessage(
        JSON.stringify({ action: 'login', payload: { email: credentials.email, password: credentials.password } }),
        MI_ORIGIN,
      );
      onSignedIn();
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frameRef, credentials, onSignedIn]);
}

export default function InboxFrame({ inbox }) {
  const frameRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const isMasterInbox = inbox?.provider === 'masterinbox';
  const credentials = isMasterInbox ? inbox.credentials : null;

  useMasterInboxLogin(frameRef, credentials, () => setSignedIn(true));

  if (!inbox?.url) {
    return (
      <div className="portal-empty inbox-empty">
        <span>↗</span>
        <h2>Inbox connection pending</h2>
        <p>GTMx has not connected an inbox to this workspace yet.</p>
      </div>
    );
  }

  // With credentials we wait for the handshake to confirm sign-in. Without them
  // there is no handshake to wait for — the user signs in inside the frame — so
  // fall back to plain load, or the overlay would never clear.
  const autoLogin = Boolean(isMasterInbox && credentials);
  const ready = autoLogin ? signedIn : loaded;
  const label = isMasterInbox ? 'Secure MasterInbox workspace' : 'Secure EmailBison workspace';

  return (
    <div className="inbox-frame">
      <div className="inbox-frame-bar">
        <span><i /> {label}</span>
        <a href={inbox.url} target="_blank" rel="noopener noreferrer">Open in new tab ↗</a>
      </div>
      {!ready ? (
        <div className="inbox-loading">
          <span />
          <p>{autoLogin ? 'Signing you in…' : 'Connecting to your master inbox…'}</p>
        </div>
      ) : null}
      <iframe
        ref={frameRef}
        src={inbox.url}
        title={label}
        onLoad={() => setLoaded(true)}
        allow="clipboard-read; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
