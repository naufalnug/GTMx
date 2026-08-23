export const clients = {
  storylane: {
    name: 'Storylane.io',
    workspaceId: 7,
    logoSrc: '/clients/storylane.svg',
    instanceUrlEnvVar: 'EMAILBISON_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_STORYLANE_API_KEY',
    tokenEnvVar: 'STORYLANE_DASHBOARD_TOKEN',
    // gtmx + dedi share leads, so combining double-counts — default to the live
    // (gtmx) numbers; dedi is opt-in via the source toggle.
    defaultSource: 'gtmx',
  },
  skai: {
    name: 'Skai.io',
    workspaceId: 13,
    logoSrc: '/clients/skai.svg',
    instanceUrlEnvVar: 'EMAILBISON_SKAI_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_SKAI_API_KEY',
    tokenEnvVar: 'SKAI_DASHBOARD_TOKEN',
    // dedi + gtmx are distinct campaigns/leads — safe to combine by default.
    defaultSource: 'all',
  },
  lookmedia: {
    name: 'LookMedia',
    workspaceId: 10,
    // Lookmedia has no dedicated client key. It's a child workspace on
    // send.gtmx.run, so the sync reaches it with the shared admin key by
    // switching into this workspace (see runSync in lib/sync.js). The reused
    // admin key stays server-side; the dashboard route only checks it's present
    // and reads from Neon.
    adminWorkspaceId: 10,
    instanceUrlEnvVar: 'EMAILBISON_GTMX_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_ADMIN_API_KEY',
    tokenEnvVar: 'LOOKMEDIA_DASHBOARD_TOKEN',
    defaultSource: 'gtmx',
  },
  flexetc: {
    name: 'FlexEtc',
    workspaceId: 12,
    // Same shape as lookmedia: a child workspace on send.gtmx.run with no
    // dedicated client key, so the sync switches in with the shared admin key.
    adminWorkspaceId: 12,
    instanceUrlEnvVar: 'EMAILBISON_GTMX_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_ADMIN_API_KEY',
    tokenEnvVar: 'FLEXETC_DASHBOARD_TOKEN',
    defaultSource: 'gtmx',
  },
};

/**
 * Resolves a client for the dashboard route: requires the secret URL token to
 * be configured (so an unconfigured client can't be reached). Returns null when
 * the slug is unknown or its token/api-key env vars are missing.
 */
export function getClient(slug) {
  const client = clients[slug];
  if (!client) return null;
  const apiKey = process.env[client.apiKeyEnvVar];
  const token = process.env[client.tokenEnvVar];
  // The dashboard reads Neon, never the EmailBison API, so the API key is only a
  // "is this client configured" gate. Admin-workspace clients (e.g. lookmedia)
  // share the server-side admin key, which needn't live in the dashboard's env —
  // the secret URL token alone gates them.
  if (!token) return null;
  if (!client.adminWorkspaceId && !apiKey) return null;
  return {
    ...client,
    slug,
    apiKey: apiKey ?? null,
    token,
    baseUrl: process.env[client.instanceUrlEnvVar] ?? null,
  };
}

/**
 * Resolves a client for the sync/ETL pipeline: needs EmailBison API access
 * (instance URL + key) but NOT the dashboard token. Returns null when those
 * are missing, so a not-yet-configured client (e.g. Skai before its key is
 * added) is simply skipped.
 */
export function getClientApiConfig(slug) {
  const client = clients[slug];
  if (!client) return null;
  const apiKey = process.env[client.apiKeyEnvVar];
  const baseUrl = process.env[client.instanceUrlEnvVar];
  if (!apiKey || !baseUrl) return null;
  return { slug, name: client.name, baseUrl, apiKey, adminWorkspaceId: client.adminWorkspaceId };
}

export function listClientSlugs() {
  return Object.keys(clients);
}
