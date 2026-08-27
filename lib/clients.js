export const clients = {
  storylane: {
    name: 'Storylane.io',
    workspaceId: 3,
    logoSrc: '/clients/storylane.svg',
    instanceUrlEnvVar: 'EMAILBISON_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_STORYLANE_API_KEY',
    tokenEnvVar: 'STORYLANE_DASHBOARD_TOKEN',
    // gtmx + dedi share leads, so combining double-counts — default to the live
    // (gtmx) numbers; dedi is opt-in via the source toggle.
    defaultSource: 'gtmx',
  },
  gtmx: {
    name: 'GTMx',
    // The main workspace on send.gtmx.run. withWorkspace switches into it and back to
    // main, which for this client is the same place — harmless.
    workspaceId: 2,
    adminWorkspaceId: 2,
    instanceUrlEnvVar: 'EMAILBISON_GTMX_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_ADMIN_API_KEY',
    tokenEnvVar: 'GTMX_DASHBOARD_TOKEN',
    defaultSource: 'gtmx',
  },
  mdj: {
    name: 'MDJ',
    workspaceId: 7,
    // Own workspace-7 key — deliberately no adminWorkspaceId. See flexetc.
    instanceUrlEnvVar: 'EMAILBISON_GTMX_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_MDJ_API_KEY',
    tokenEnvVar: 'MDJ_DASHBOARD_TOKEN',
    defaultSource: 'gtmx',
  },
  lookmedia: {
    name: 'LookMedia',
    workspaceId: 10,
    // Own workspace-10 key — deliberately no adminWorkspaceId. See flexetc.
    // Lookmedia has no dedicated client key. It's a child workspace on
    // switching into this workspace (see runSync in lib/sync.js). The reused
    // admin key stays server-side; the dashboard route only checks it's present
    // and reads from Neon.
    instanceUrlEnvVar: 'EMAILBISON_GTMX_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_LOOKMEDIA_API_KEY',
    tokenEnvVar: 'LOOKMEDIA_DASHBOARD_TOKEN',
    defaultSource: 'gtmx',
  },
  uksalesincrease: {
    name: 'UK Sales Increase',
    workspaceId: 11,
    // Own workspace-11 key — deliberately no adminWorkspaceId. See flexetc.
    instanceUrlEnvVar: 'EMAILBISON_GTMX_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_UKSALESINCREASE_API_KEY',
    tokenEnvVar: 'UKSALESINCREASE_DASHBOARD_TOKEN',
    defaultSource: 'gtmx',
  },
  flexetc: {
    name: 'FlexEtc',
    workspaceId: 12,
    // Has its OWN workspace-12 key, so deliberately no adminWorkspaceId: the sync
    // talks to workspace 12 directly and never switches.
    //
    // Switching with the shared admin key is a server-side POST that changes state
    // globally for that key, so two concurrent syncs clobber each other and a client
    // ends up storing another workspace's leads. That is not hypothetical — it is why
    // flexetc's contacts table was 98% GTMx leads and the contact-to-lead ratio was
    // blank. lookmedia (10) and uksalesincrease (11) still share the admin key and
    // remain exposed until they get their own keys.
    instanceUrlEnvVar: 'EMAILBISON_GTMX_INSTANCE_URL',
    apiKeyEnvVar: 'EMAILBISON_FLEXETC_API_KEY',
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
