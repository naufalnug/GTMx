// Workspace-aware EmailBison admin client.
//
// Uses a super-admin API key (EMAILBISON_ADMIN_API_KEY) that can see every
// workspace on the send.gtmx.run instance. EmailBison has no per-request
// workspace scoping — the active workspace is a STATEFUL property of the key's
// account, changed via POST /api/workspaces/switch-workspace {team_id}.
//
// `withWorkspace(cfg, name, fn)` resolves a workspace by name, switches into it,
// runs `fn`, and ALWAYS switches back to the main (GTMx) workspace in a finally
// block, so the key is left in a predictable state. The switch is global to the
// key's account, so admin-key operations must run sequentially (never concurrent).

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Admin config from env. Returns null when the key is absent (skip, not fatal). */
export function getAdminConfig() {
  const apiKey = process.env.EMAILBISON_ADMIN_API_KEY;
  const baseUrl = process.env.EMAILBISON_GTMX_INSTANCE_URL || 'https://send.gtmx.run';
  if (!apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };
}

/** fetch wrapper with Bearer auth, timeout and retry. Supports GET/POST. */
export async function adminRequest(cfg, path, { method = 'GET', body } = {}) {
  const url = `${cfg.baseUrl}${path}`;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      // switch-workspace returns JSON; tolerate empty bodies.
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(400 * attempt);
    }
  }
  throw new Error(`EmailBison ${method} ${path} failed after ${MAX_RETRIES} tries: ${lastErr?.message}`);
}

/** All workspaces the key can see: [{id, name, parent_id, main}]. */
export async function listWorkspaces(cfg) {
  const d = await adminRequest(cfg, '/api/workspaces');
  const rows = d?.data ?? d ?? [];
  return (Array.isArray(rows) ? rows : []).map((w) => ({
    id: w.id,
    name: w.name,
    parent_id: w.parent_id ?? null,
    main: Boolean(w.main),
  }));
}

/** The main workspace id (GTMx). Resolved dynamically from `main: true`. */
export async function mainWorkspaceId(cfg, workspaces) {
  const list = workspaces ?? (await listWorkspaces(cfg));
  const main = list.find((w) => w.main);
  return main?.id ?? 2;
}

/**
 * Resolve a workspace selector to an id. Numbers pass through. Names match
 * case-insensitively: exact first, then unique substring. Throws (listing valid
 * names) on no-match or ambiguous-substring.
 */
export async function resolveWorkspaceId(cfg, selector, workspaces) {
  if (selector == null || selector === '') throw new Error('No workspace given.');
  if (/^\d+$/.test(String(selector))) return Number(selector);
  const list = workspaces ?? (await listWorkspaces(cfg));
  const q = String(selector).trim().toLowerCase();
  const exact = list.filter((w) => (w.name || '').toLowerCase() === q);
  if (exact.length === 1) return exact[0].id;
  const partial = list.filter((w) => (w.name || '').toLowerCase().includes(q));
  if (partial.length === 1) return partial[0].id;
  const names = list.map((w) => `${w.name} (${w.id})`).join(', ');
  if (partial.length > 1) {
    throw new Error(`"${selector}" is ambiguous — matches: ${partial.map((w) => w.name).join(', ')}. Valid: ${names}`);
  }
  throw new Error(`No workspace matches "${selector}". Valid: ${names}`);
}

/** Switch the key's active workspace. Stateful (server-side, global to the key). */
export async function switchWorkspace(cfg, teamId) {
  return adminRequest(cfg, '/api/workspaces/switch-workspace', {
    method: 'POST',
    body: { team_id: Number(teamId) },
  });
}

/**
 * Run `fn(cfg, workspaceId, workspace)` with the key switched into `selector`,
 * then ALWAYS switch back to the main (GTMx) workspace. Returns fn's result.
 */
export async function withWorkspace(cfg, selector, fn) {
  const workspaces = await listWorkspaces(cfg);
  const id = await resolveWorkspaceId(cfg, selector, workspaces);
  const mainId = await mainWorkspaceId(cfg, workspaces);
  const workspace = workspaces.find((w) => w.id === id) ?? { id, name: String(selector) };
  await switchWorkspace(cfg, id);
  try {
    return await fn(cfg, id, workspace);
  } finally {
    try {
      await switchWorkspace(cfg, mainId);
    } catch (err) {
      // Surface but don't mask the primary error/result.
      console.error(`⚠ Failed to reset active workspace to main (${mainId}): ${err.message}`);
    }
  }
}
