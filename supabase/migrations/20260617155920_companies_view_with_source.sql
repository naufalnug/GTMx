-- Add source to the companies rollup so it can be filtered per EmailBison
-- instance. For an "all" view the read layer re-aggregates by domain across
-- sources (which double-counts contacts shared between instances, by design).
drop view if exists companies;
create view companies with (security_invoker = true) as
select
  client,
  source,
  domain,
  mode() within group (order by company) as company,
  sum(emails_sent)::int as emails_sent,
  count(*)::int as contacts
from contacts
where domain is not null and domain <> ''
group by client, source, domain;;
