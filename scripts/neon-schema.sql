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
-- "Companies we've emailed" rolls up by COMPANY (the contact's employer), not by
-- email domain: a large share of contacts are reached on personal/ISP inboxes
-- (gmail, yahoo, comcast, …), and grouping those by domain collapses many real
-- companies into fake "gmail.com" rows. `domain` here is a representative
-- corporate email domain for the company (its most common non-personal sender
-- domain), or null when we only have personal emails for that company.
create or replace view companies as
select
  client,
  source,
  -- Representative corporate domain: the company's most common non-personal
  -- sender domain, but only when it's a MAJORITY of that company's contacts (a
  -- real corporate domain dominates; a stray .edu/ISP address from a personal-
  -- email-sourced company does not). Null otherwise → shown as "personal email".
  (
    select t.dom from (
      select split_part(c2.email, '@', 2) as dom, count(*) as n
      from contacts c2
      where c2.client = c.client and c2.source = c.source and c2.company = c.company
        and c2.email is not null and c2.email <> ''
        and split_part(c2.email, '@', 2) not in (
          'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','aol.com',
          'protonmail.com','proton.me','ymail.com','live.com','msn.com','me.com','mac.com',
          'comcast.net','att.net','verizon.net','sbcglobal.net','charter.net','cox.net',
          'bellsouth.net','earthlink.net','frontier.com','aim.com','gmx.com','mail.com',
          'pacbell.net','ameritech.net','windstream.net','roadrunner.com','optonline.net'
        )
      group by split_part(c2.email, '@', 2)
      order by n desc, dom
      limit 1
    ) t
    where t.n * 2 >= (
      select count(*) from contacts c3
      where c3.client = c.client and c3.source = c.source and c3.company = c.company
    )
  ) as domain,
  company,
  sum(emails_sent)::bigint as emails_sent,
  count(*)::bigint         as contacts
from contacts c
where company is not null and company <> ''
group by client, source, company;

-- ── crm_pushed_replies ledger ───────────────────────────────────────────────
-- Idempotency ledger for the EmailBison -> Twenty CRM pipeline (lib/crmPush.js).
-- One row per interested reply pushed into Twenty; crm_note_id being set means
-- the reply is fully processed and must never be re-pushed (notes have no other
-- dedup key). Written by the webhook + the hourly reconcile cron.
create table if not exists crm_pushed_replies (
  workspace_id   text        not null,   -- EmailBison workspace id ('29' = GTMx)
  reply_id       bigint      not null,
  lead_id        bigint,
  email          text,
  crm_company_id uuid,
  crm_person_id  uuid,
  crm_note_id    uuid,
  pushed_at      timestamptz,
  error          text,
  updated_at     timestamptz not null default now(),
  primary key (workspace_id, reply_id)
);
create index if not exists idx_crm_pushed_pending
  on crm_pushed_replies (workspace_id) where crm_note_id is null;
