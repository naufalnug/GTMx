-- ─────────────────────────────────────────────────────────────────────────
-- GTMx blog CMS schema.
-- Run this once in the Supabase dashboard → SQL editor (or psql) before using
-- the /admin CMS. RLS is enabled with NO policies, matching the rest of the
-- project: only the service-role key (used server-side in lib/supabase.js)
-- can read or write, so nothing is ever exposed to the browser directly.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.articles (
  id           bigint generated always as identity primary key,
  slug         text unique not null,
  title        text not null,
  excerpt      text not null default '',
  body         text not null default '',
  tags         text[] not null default '{}',
  status       text not null default 'draft',   -- 'draft' | 'published'
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_articles_status_pub
  on public.articles (status, published_at desc);
create index if not exists idx_articles_slug on public.articles (slug);
create index if not exists idx_articles_tags on public.articles using gin (tags);

alter table public.articles enable row level security;
