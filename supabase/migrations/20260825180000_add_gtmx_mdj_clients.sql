-- GTMx (main workspace, id 2) and MDJ (id 7) become portal clients. Both are
-- workspaces on send.gtmx.run reached with the shared admin key, same shape as
-- lookmedia, flexetc and uksalesincrease.
insert into public.clients (slug, name, instance_url, workspace_id, default_source, active)
values
  ('gtmx', 'GTMx', 'https://send.gtmx.run', 2, 'gtmx', true),
  ('mdj',  'MDJ',  'https://send.gtmx.run', 7, 'gtmx', true)
on conflict (slug) do update set
  name = excluded.name,
  instance_url = excluded.instance_url,
  workspace_id = excluded.workspace_id,
  default_source = excluded.default_source,
  active = excluded.active,
  updated_at = now();

-- Skai is wound down: removed from lib/clients.js so it no longer syncs, and already
-- inactive so no client can reach it. Its stored rows are NOT deleted here — that
-- cascade drops ~8k contacts and 21k daily rows, so it is left as a deliberate manual
-- step. To finish the removal:
--   delete from public.clients where slug = 'skai';
