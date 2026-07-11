-- ─────────────────────────────────────────────────────────────────────────
-- GTMx database schema — Neon (Vercel Postgres).
--
-- Run this ONCE against your Neon database before using the site's dynamic
-- features. Two ways:
--   • Neon Console → your project → SQL Editor → paste + Run, or
--   • psql "$DATABASE_URL" -f scripts/neon-schema.sql
--
-- Unlike the old Supabase setup, Neon has no PostgREST layer and no anon key,
-- so there is nothing to lock down with RLS: the database is reachable only via
-- the server-side DATABASE_URL, never from the browser. Every table below is
-- read/written exclusively by the server (lib/*.js).
--
-- Idempotent — safe to re-run (CREATE ... IF NOT EXISTS throughout).
-- ─────────────────────────────────────────────────────────────────────────

-- ── Blog CMS ───────────────────────────────────────────────────────────────
-- `body` is HTML produced by the admin WYSIWYG editor; legacy rows may hold
-- the old lightweight-markdown format (detected at render time).
create table if not exists articles (
  id               bigint generated always as identity primary key,
  slug             text unique not null,
  title            text not null,
  excerpt          text not null default '',
  body             text not null default '',
  cover_image      text,                             -- Vercel Blob URL, optional
  cover_alt        text,                             -- alt text for the cover image
  og_image         text,                             -- social-share image override (defaults to cover)
  meta_title       text,                             -- <title> override (defaults to title)
  meta_description text,                             -- meta description override (defaults to excerpt)
  canonical_url    text,                             -- canonical override (defaults to the post URL)
  custom_schema    jsonb,                            -- extra schema.org JSON-LD (object or array)
  faqs             jsonb not null default '[]',      -- [{"question": "...", "answer": "..."}]
  tags             text[] not null default '{}',
  status           text not null default 'draft',    -- 'draft' | 'published'
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Idempotent upgrades for tables created before these columns existed:
alter table articles add column if not exists cover_image      text;
alter table articles add column if not exists cover_alt        text;
alter table articles add column if not exists og_image         text;
alter table articles add column if not exists meta_title       text;
alter table articles add column if not exists meta_description text;
alter table articles add column if not exists canonical_url    text;
alter table articles add column if not exists custom_schema    jsonb;
alter table articles add column if not exists faqs             jsonb not null default '[]';

create index if not exists idx_articles_status_pub on articles (status, published_at desc);
create index if not exists idx_articles_slug        on articles (slug);
create index if not exists idx_articles_tags        on articles using gin (tags);

-- ── Client registry ─────────────────────────────────────────────────────────
-- One row per dashboard client (slug matches lib/clients.js). Only tracks the
-- last successful sync; all other client config lives in code / env vars.
create table if not exists clients (
  slug           text primary key,
  last_synced_at timestamptz
);

insert into clients (slug) values ('storylane'), ('skai')
  on conflict (slug) do nothing;

-- ── EmailBison outreach data (populated by the sync; see lib/sync.js) ────────
-- IDs from EmailBison are only unique WITHIN an instance, so every table is
-- keyed by (client, source, …). `source` is the instance short-name
-- ('gtmx' | 'dedi'), derived from the instance host at sync time.

create table if not exists campaigns (
  client      text   not null,
  source      text   not null,
  campaign_id bigint not null,
  name        text,
  status      text,
  type        text,
  total_leads integer not null default 0,
  contacts    integer not null default 0,
  sent        integer not null default 0,
  replies     integer not null default 0,
  bounced     integer not null default 0,
  interested  integer not null default 0,
  completion  numeric not null default 0,
  updated_at  timestamptz,
  primary key (client, source, campaign_id)
);
create index if not exists idx_campaigns_client on campaigns (client, source);

create table if not exists campaign_daily_stats (
  client      text   not null,
  source      text   not null,
  campaign_id bigint not null,
  date        date   not null,
  sent        integer not null default 0,
  replies     integer not null default 0,
  bounced     integer not null default 0,
  primary key (client, source, campaign_id, date)
);
create index if not exists idx_daily_client_date on campaign_daily_stats (client, source, date);

create table if not exists sequence_steps (
  client       text   not null,
  source       text   not null,
  campaign_id  bigint not null,
  step_id      bigint not null,
  step_order   integer not null default 0,
  subject      text,
  body         text,
  wait_in_days integer not null default 0,
  thread_reply boolean not null default false,
  primary key (client, source, campaign_id, step_id)
);
create index if not exists idx_steps_campaign on sequence_steps (client, source, campaign_id);

create table if not exists interested_replies (
  client        text   not null,
  source        text   not null,
  reply_id      bigint not null,
  campaign_id   bigint,
  campaign_name text,
  date_received timestamptz,
  first_name    text,
  last_name     text,
  full_name     text,
  title         text,
  company       text,
  industry      text,
  email         text,
  email_domain  text,
  subject       text,
  snippet       text,
  primary key (client, source, reply_id)
);
create index if not exists idx_replies_client_date on interested_replies (client, source, date_received desc);

create table if not exists contacts (
  client      text   not null,
  source      text   not null,
  lead_id     bigint not null,
  email       text,
  first_name  text,
  last_name   text,
  title       text,
  company     text,
  domain      text,
  status      text,
  tags        jsonb,
  emails_sent integer not null default 0,
  opens       integer not null default 0,
  replies     integer not null default 0,
  interested  boolean not null default false,
  created_at  timestamptz,
  updated_at  timestamptz,
  primary key (client, source, lead_id)
);
create index if not exists idx_contacts_client        on contacts (client, source);
create index if not exists idx_contacts_client_domain on contacts (client, source, domain);

-- ── companies view ──────────────────────────────────────────────────────────
-- "Companies we've emailed", grouped per (client, source, domain). Rolls up the
-- contacted leads in `contacts`; the dashboard re-aggregates across sources for
-- the 'all' view. Representative company name = the most common non-null label
-- for the domain (ties broken alphabetically).
create or replace view companies as
select
  client,
  source,
  domain,
  (
    select c2.company
    from contacts c2
    where c2.client = c.client and c2.source = c.source and c2.domain = c.domain
      and c2.company is not null
    group by c2.company
    order by count(*) desc, c2.company
    limit 1
  ) as company,
  sum(emails_sent)::bigint as emails_sent,
  count(*)::bigint         as contacts
from contacts c
where domain is not null and domain <> ''
group by client, source, domain;
