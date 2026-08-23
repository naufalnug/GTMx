create table if not exists public.crm_pushed_replies (
  workspace_id   text        not null,
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

create index if not exists crm_pushed_replies_pending_idx
  on public.crm_pushed_replies (workspace_id)
  where crm_note_id is null;

-- RLS-locked with no policies; only the service role (which bypasses RLS) touches it,
-- matching the convention of the other sync tables.
alter table public.crm_pushed_replies enable row level security;;
