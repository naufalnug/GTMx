# Moving Supabase from Seoul to US East

## Why

The portal is slow because of geography, not code. Supabase sits in `ap-northeast-2`
(Seoul); Vercel functions default to `iad1` (Virginia). Every query is an ~11,000 km
round trip at roughly 250ms, and a portal page makes about 18 of them.

Measured on the smallest client (FlexEtc, 1,990 contacts):

| Page | Before query trimming | After | Predicted after region move |
|---|---|---|---|
| `/portal` | 4,011ms | 2,888ms | ~400ms |
| `/portal/inbox` | 2,502ms | 1,720ms | ~250ms |

Trimming queries bought ~28%. The region move is the other ~85%.

Supabase **cannot** change a project's region in place — the documented path is to
create a new project in the target region and migrate into it.

## The shortcut that makes this cheap

Total database size is ~183 MB, and **~99% of it is derived**:

| Table | Rows | Size | Rebuildable? |
|---|---|---|---|
| `campaign_daily_stats` | 545,305 | 105 MB | ✅ `npm run sync` |
| `contacts` | 161,867 | 76 MB | ✅ `npm run sync` |
| `sequence_steps` | 515 | 816 kB | ✅ `npm run sync` |
| `interested_replies` | 390 | 424 kB | ✅ `npm run sync` |
| `campaigns` | 227 | 152 kB | ✅ `npm run sync` |
| **`crm_pushed_replies`** | **48** | 80 kB | ❌ **never** |
| `clients` | 7 | 32 kB | ⚠️ partly (migrations restore rows, not settings) |
| `portal_memberships` | 1 | — | ❌ |
| `auth.users` | 3 | — | ❌ (passwords unrecoverable) |
| `portal_notifications` | 151 | 136 kB | ⚠️ re-seedable, history approximate |

So there is no need for `pg_dump`/`pg_restore`. Push the migrations, carry the handful
of non-derived rows, then re-sync.

**`crm_pushed_replies` is the one that bites.** It is the ledger recording which
interested replies have already been pushed into Twenty CRM. Lose it and the next CRM
push re-pushes all 48, creating duplicate companies, people and notes in Twenty.

## Runbook

Nothing here is destructive to the current project until step 7. The old project stays
live and serving throughout, so you can abort at any point before the cutover.

### 1. Export what cannot be rebuilt
```bash
node scripts/export-portal-state.mjs
# → outputs/portal-state-<date>.json   (gitignored: contains client emails)
```

### 2. Create the new project
Supabase dashboard → New project, region **East US (North Virginia)** — matching Vercel's
`iad1`. Same organisation. Note the new project ref, database password, and both API keys.

### 3. Push the schema
All 12 migrations in `supabase/migrations/` reproduce the full schema, including RLS
policies, the `can_access_portal_client` / `is_portal_admin` helpers, the
`prune_portal_contacts` RPC, and the `companies` / `contacts_daily` views.

```bash
supabase link --project-ref <new-ref>
supabase db push
```

### 4. Carry `PORTAL_ENCRYPTION_KEY` across unchanged
FlexEtc's inbox URL is encrypted with it. A different key means the ciphertext will not
decrypt and the inbox tab silently falls back to its empty state.

### 5. Import the non-derived rows
```bash
TARGET_SUPABASE_URL=https://<new-ref>.supabase.co \
TARGET_SUPABASE_SECRET_KEY=<new secret key> \
node scripts/import-portal-state.mjs outputs/portal-state-<date>.json
```
Prints a temporary password per account. All three logins need a reset — Supabase does
not expose password hashes through the admin API.

### 6. Rebuild the derived data
Point `.env.local` at the new project, then:
```bash
npm run sync                      # all clients; expect ~40-60 min for the full roster
npm run portal:seed-notifications # optional, if notification history looks thin
```
GTMx (66k contacts) and Storylane (62k) dominate that time.

### 7. Cut over
Swap in Vercel → Settings → Environment Variables, then redeploy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DATABASE_URL` / `POSTGRES_*` if the Neon-style vars still point at Supabase

Leave `PORTAL_ENCRYPTION_KEY` and `CRON_SECRET` untouched.

### 8. Verify
```bash
node scripts/verify-portal-migration.mjs   # row-count and RLS parity, old vs new
```
Then by hand: sign in as a client, confirm the dashboard, notification bell, leads and
inbox all render, and time a page load — it should land near 400ms.

### 9. Only then
Delete or pause the Seoul project. Keep it for a few days; it costs nothing to leave
paused and it is the only rollback.

## Rollback

Before step 7, there is nothing to roll back — the old project is still serving. After
step 7, revert the four Vercel env vars and redeploy. The Seoul project is untouched by
this process apart from being read.

## Afterwards

Re-check `/api/cron/sync`. With the database 5ms from the function rather than 250ms,
plus the hang fix in `lib/emailbison.js`, the full-roster run gets dramatically more
headroom inside the 300s ceiling — though with GTMx and Storylane at ~60k contacts each,
the per-client fan-out via n8n is still the right shape.
