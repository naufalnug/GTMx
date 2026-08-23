'use client';

import { useFormStatus } from 'react-dom';
import { syncClientDataAction } from '../actions';

function Button() {
  // A full workspace pull takes tens of seconds, so the pending state matters —
  // without it the button looks inert and invites repeat clicks.
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="sync-button" disabled={pending} aria-live="polite">
      <span className={pending ? 'sync-spinner' : 'sync-icon'} aria-hidden="true" />
      {pending ? 'Syncing…' : 'Sync data'}
    </button>
  );
}

export default function SyncButton({ previewClient }) {
  return (
    <form action={syncClientDataAction}>
      {previewClient ? <input type="hidden" name="client" value={previewClient} /> : null}
      <Button />
    </form>
  );
}
