-- Contacts added per day, for the portal's activity chart.
--
-- security_invoker so the caller's RLS applies, matching the existing `companies`
-- view. Grouping in the database keeps the portal from pulling 60k contact rows
-- just to bucket them by date.
--
-- NOTE: created_at is when the lead was created in EmailBison, i.e. when a list was
-- imported — not when it was first emailed. Expect spikes on import days rather than
-- a daily trickle.
create or replace view public.contacts_daily
with (security_invoker = true) as
select
  client,
  source,
  created_at::date as date,
  count(*)::int    as contacts
from public.contacts
where created_at is not null
group by client, source, created_at::date;

grant select on public.contacts_daily to authenticated;
