-- MasterInbox embeds authenticate via a postMessage handshake rather than a plain
-- iframe URL, so the inbox needs a provider discriminator and a credential blob.
-- Credentials are encrypted at rest with PORTAL_ENCRYPTION_KEY, same as the URL.
alter table public.clients
  add column if not exists inbox_provider text not null default 'iframe',
  add column if not exists inbox_credentials_ciphertext text;

alter table public.clients
  drop constraint if exists clients_inbox_provider_check;

alter table public.clients
  add constraint clients_inbox_provider_check
  check (inbox_provider in ('iframe', 'masterinbox'));

comment on column public.clients.inbox_credentials_ciphertext is
  'Encrypted JSON of embed login details. Only decrypted server-side for a viewer with a matching portal_memberships row.';
