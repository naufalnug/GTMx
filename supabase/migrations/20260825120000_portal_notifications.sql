-- In-portal notification feed for client dashboards.
--
-- Events are computed during the sync by diffing incoming EmailBison state against
-- what is already stored (see lib/notifications.js). The sync runs every 15 minutes
-- and recomputes the same events every run, so idempotency is enforced here in the
-- schema rather than in application bookkeeping: every insert goes through
-- ON CONFLICT DO NOTHING against portal_notifications_dedupe_idx.

create table if not exists public.portal_notifications (
  id            bigint generated always as identity primary key,
  client        text not null references public.clients(slug) on delete cascade,
  source        text not null,
  kind          text not null check (kind in (
                  'lead.interested',
                  'campaign.leads_added',
                  'campaign.launched',
                  'campaign.message_market_fit')),
  -- Natural key of the underlying thing. Stable across re-syncs by construction:
  -- see the dedupe_key table in lib/notifications.js.
  dedupe_key    text not null,
  title         text not null,
  body          text,
  campaign_id   bigint,
  campaign_name text,
  detail        jsonb not null default '{}'::jsonb,
  -- When the thing happened, which is not when we noticed it. Drives feed order.
  event_at      timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create unique index if not exists portal_notifications_dedupe_idx
  on public.portal_notifications (client, dedupe_key);

-- id is the tiebreak so paging stays stable when several events share an event_at.
create index if not exists portal_notifications_feed_idx
  on public.portal_notifications (client, event_at desc, id desc);

-- Read state, mechanism 1: a watermark, so "mark all read" is one UPDATE rather
-- than an insert per notification.
alter table public.portal_memberships
  add column if not exists notifications_read_through_id bigint not null default 0;

-- Read state, mechanism 2: per-item, so a single notification can be dismissed
-- without burying everything older than it.
--
-- Keyed on user_id rather than client_slug: portal_memberships is 1:1 with clients
-- today, but that is one unique index away from changing, and per-user costs nothing
-- extra here. `client` is denormalised so the unread count is a single indexed
-- lookup with no join.
create table if not exists public.portal_notification_reads (
  user_id         uuid   not null references auth.users(id) on delete cascade,
  notification_id bigint not null references public.portal_notifications(id) on delete cascade,
  client          text   not null references public.clients(slug) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (user_id, notification_id)
);

create index if not exists portal_notification_reads_user_idx
  on public.portal_notification_reads (user_id, client, notification_id);

alter table public.portal_notifications enable row level security;
alter table public.portal_notification_reads enable row level security;

drop policy if exists "members read notifications" on public.portal_notifications;
create policy "members read notifications"
  on public.portal_notifications for select to authenticated
  using (public.can_access_portal_client(client));

drop policy if exists "members read own notification reads" on public.portal_notification_reads;
create policy "members read own notification reads"
  on public.portal_notification_reads for select to authenticated
  using (user_id = (select auth.uid()) or public.is_portal_admin());

-- Browser clients are read-only, matching every other portal table. The sync and the
-- mark-read server actions write with the secret key.
revoke insert, update, delete on public.portal_notifications from anon, authenticated;
revoke insert, update, delete on public.portal_notification_reads from anon, authenticated;
grant select on public.portal_notifications to authenticated;
grant select on public.portal_notification_reads to authenticated;

-- Launch day starts at zero unread. The table is empty right now so this is a no-op,
-- but it states the intent and is the right thing to re-run after a history seed.
update public.portal_memberships
set notifications_read_through_id =
  coalesce((select max(id) from public.portal_notifications), 0);
