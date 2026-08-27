-- Storylane was seeded with workspace_id 7 in 20260617133357 (the original
-- outreach database). MDJ was later added as the actual send.gtmx.run workspace
-- 7 (20260825180000). lib/clients.js lists Storylane as workspace 3 and reaches
-- it with EMAILBISON_STORYLANE_API_KEY — not an admin workspace switch — so the
-- EmailBison sync never reads clients.workspace_id. This column is portal-admin
-- metadata; align it with the registry so Storylane and MDJ no longer collide.
update public.clients
set workspace_id = 3, updated_at = now()
where slug = 'storylane' and workspace_id is distinct from 3;
