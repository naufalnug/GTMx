-- Extend the existing Client Database for the authenticated GTMx portal.
-- This migration is additive: existing campaign and client records are preserved.

create extension if not exists pgcrypto;

alter table public.clients add column if not exists brand_color text not null default '#E8552B';
alter table public.clients add column if not exists active boolean not null default true;
alter table public.clients add column if not exists default_source text not null default 'all';
alter table public.clients add column if not exists inbox_url_ciphertext text;
alter table public.clients add column if not exists sync_error text;
alter table public.clients add column if not exists created_at timestamptz not null default now();
alter table public.clients add column if not exists updated_at timestamptz not null default now();

-- Preserve the defaults used by the previous dashboards.
update public.clients set default_source = 'gtmx' where slug in ('storylane', 'lookmedia') and default_source = 'all';

-- Read-only compatibility view for the admin surface. The canonical registry
-- remains public.clients; this view does not duplicate data.
create or replace view public.portal_clients
with (security_invoker = true)
as
select
  slug, name, instance_url, workspace_id,
  workspace_id as emailbison_workspace_id,
  logo_src, last_synced_at, brand_color, active, default_source,
  inbox_url_ciphertext, sync_error, created_at, updated_at
from public.clients;

create table if not exists public.portal_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  client_slug text not null references public.clients(slug) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index if not exists portal_memberships_client_slug_key on public.portal_memberships(client_slug);

create table if not exists public.portal_audit_events (
  id bigint generated always as identity primary key,
  client_slug text references public.clients(slug) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists portal_audit_events_client_date_idx
  on public.portal_audit_events(client_slug, created_at desc);

alter table public.clients enable row level security;
alter table public.portal_memberships enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_daily_stats enable row level security;
alter table public.sequence_steps enable row level security;
alter table public.interested_replies enable row level security;
alter table public.contacts enable row level security;
alter table public.portal_audit_events enable row level security;

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'admin', false)
$$;

create or replace function public.can_access_portal_client(target_slug text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select public.is_portal_admin() or exists (
    select 1
    from public.portal_memberships m
    where m.user_id = (select auth.uid())
      and m.client_slug = target_slug
  )
$$;

drop policy if exists "members read own membership" on public.portal_memberships;
create policy "members read own membership"
on public.portal_memberships for select to authenticated
using (user_id = (select auth.uid()) or public.is_portal_admin());

drop policy if exists "members read client" on public.clients;
create policy "members read client"
on public.clients for select to authenticated
using (public.can_access_portal_client(slug));

drop policy if exists "members read campaigns" on public.campaigns;
create policy "members read campaigns"
on public.campaigns for select to authenticated
using (public.can_access_portal_client(client));

drop policy if exists "members read daily stats" on public.campaign_daily_stats;
create policy "members read daily stats"
on public.campaign_daily_stats for select to authenticated
using (public.can_access_portal_client(client));

drop policy if exists "members read sequence steps" on public.sequence_steps;
create policy "members read sequence steps"
on public.sequence_steps for select to authenticated
using (public.can_access_portal_client(client));

drop policy if exists "members read replies" on public.interested_replies;
create policy "members read replies"
on public.interested_replies for select to authenticated
using (public.can_access_portal_client(client));

drop policy if exists "members read contacts" on public.contacts;
create policy "members read contacts"
on public.contacts for select to authenticated
using (public.can_access_portal_client(client));

drop policy if exists "admins read audit" on public.portal_audit_events;
create policy "admins read audit"
on public.portal_audit_events for select to authenticated
using (public.is_portal_admin());

-- Browser clients are read-only. Trusted sync/admin code uses the secret key.
revoke insert, update, delete on public.clients from anon, authenticated;
revoke insert, update, delete on public.portal_memberships from anon, authenticated;
revoke insert, update, delete on public.campaigns from anon, authenticated;
revoke insert, update, delete on public.campaign_daily_stats from anon, authenticated;
revoke insert, update, delete on public.sequence_steps from anon, authenticated;
revoke insert, update, delete on public.interested_replies from anon, authenticated;
revoke insert, update, delete on public.contacts from anon, authenticated;
revoke insert, update, delete on public.portal_audit_events from anon, authenticated;

grant select on public.clients, public.portal_memberships, public.campaigns,
  public.campaign_daily_stats, public.sequence_steps, public.interested_replies,
  public.contacts, public.portal_audit_events to authenticated;
grant select on public.portal_clients to authenticated;

create or replace function public.prune_portal_contacts(
  target_client text,
  target_source text,
  keep_ids bigint[]
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare removed integer;
begin
  delete from public.contacts
  where client = target_client
    and source = target_source
    and not (lead_id = any(keep_ids));
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.prune_portal_contacts(text, text, bigint[]) from public, anon, authenticated;
grant execute on function public.prune_portal_contacts(text, text, bigint[]) to service_role;

-- The existing DDL event trigger calls this internally; it is not a public API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
