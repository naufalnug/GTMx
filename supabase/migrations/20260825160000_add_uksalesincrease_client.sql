insert into public.clients (
  slug, name, instance_url, workspace_id, default_source, active
)
values (
  'uksalesincrease',
  'UK Sales Increase',
  'https://send.gtmx.run',
  11,
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
