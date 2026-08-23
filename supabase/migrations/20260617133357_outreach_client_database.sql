-- Client outreach database: email performance, sends, contacts, interested leads.
-- Sourced from EmailBison (both instances) by the sync script. RLS locks every
-- table; the dashboard + sync use the service-role key which bypasses RLS.

create table clients (
  slug text primary key,
  name text not null,
  instance_url text,
  workspace_id integer,
  logo_src text,
  last_synced_at timestamptz
);

create table campaigns (
  client text not null references clients(slug) on delete cascade,
  campaign_id bigint not null,
  name text,
  status text,
  type text,
  total_leads integer default 0,
  contacts integer default 0,
  sent integer default 0,
  replies integer default 0,
  bounced integer default 0,
  interested integer default 0,
  completion numeric default 0,
  updated_at timestamptz default now(),
  primary key (client, campaign_id)
);

create table campaign_daily_stats (
  client text not null references clients(slug) on delete cascade,
  campaign_id bigint not null,
  date date not null,
  sent integer default 0,
  replies integer default 0,
  bounced integer default 0,
  primary key (client, campaign_id, date)
);

create table sequence_steps (
  client text not null references clients(slug) on delete cascade,
  campaign_id bigint not null,
  step_id bigint not null,
  step_order integer default 0,
  subject text,
  body text,
  wait_in_days integer default 0,
  thread_reply boolean default false,
  primary key (client, campaign_id, step_id)
);

create table contacts (
  client text not null references clients(slug) on delete cascade,
  lead_id bigint not null,
  email text,
  first_name text,
  last_name text,
  title text,
  company text,
  domain text,
  status text,
  tags jsonb,
  emails_sent integer default 0,
  opens integer default 0,
  replies integer default 0,
  interested boolean default false,
  created_at timestamptz,
  updated_at timestamptz,
  primary key (client, lead_id)
);

create table interested_replies (
  client text not null references clients(slug) on delete cascade,
  reply_id bigint not null,
  campaign_id bigint,
  campaign_name text,
  date_received timestamptz,
  first_name text,
  last_name text,
  full_name text,
  title text,
  company text,
  industry text,
  email text,
  email_domain text,
  subject text,
  snippet text,
  primary key (client, reply_id)
);

create index campaigns_client_idx on campaigns (client);
create index contacts_client_domain_idx on contacts (client, domain);
create index interested_replies_client_date_idx on interested_replies (client, date_received);
create index campaign_daily_stats_client_date_idx on campaign_daily_stats (client, date);

-- Companies = contacts grouped by email domain. security_invoker so the view
-- respects the querying role's RLS (anon sees nothing; service role sees all).
create view companies with (security_invoker = true) as
select
  client,
  domain,
  mode() within group (order by company) as company,
  sum(emails_sent)::int as emails_sent,
  count(*)::int as contacts
from contacts
where domain is not null and domain <> ''
group by client, domain;

alter table clients enable row level security;
alter table campaigns enable row level security;
alter table campaign_daily_stats enable row level security;
alter table sequence_steps enable row level security;
alter table contacts enable row level security;
alter table interested_replies enable row level security;

insert into clients (slug, name, instance_url, workspace_id, logo_src) values
  ('storylane', 'Storylane.io', 'https://send.gtmx.run', 7, '/clients/storylane.svg'),
  ('skai', 'Skai.io', null, null, '/clients/skai.svg');;
