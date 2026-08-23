insert into public.clients (
  slug, name, instance_url, workspace_id, default_source, active
)
values (
  'flexetc',
  'FlexEtc',
  'https://send.gtmx.run',
  12,
  'gtmx',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  instance_url = excluded.instance_url,
  workspace_id = excluded.workspace_id,
  default_source = excluded.default_source,
  active = excluded.active,
  updated_at = now();
