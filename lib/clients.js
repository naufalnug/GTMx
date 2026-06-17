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
  if (!apiKey || !token) return null;
  return {
    ...client,
    slug,
    apiKey,
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
  return { slug, name: client.name, baseUrl, apiKey };
}

export function listClientSlugs() {
  return Object.keys(clients);
}
