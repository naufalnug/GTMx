export const clients = {
  storylane: {
    name: 'Storylane.io',
    workspaceId: 7,
    logoSrc: '/clients/storylane.svg',
    tokenEnvVar: 'STORYLANE_DASHBOARD_TOKEN',
    apiKeyEnvVar: 'EMAILBISON_STORYLANE_API_KEY',
  },
};

export function getClient(slug) {
  const client = clients[slug];
  if (!client) return null;
  const apiKey = process.env[client.apiKeyEnvVar];
  const token = process.env[client.tokenEnvVar];
  if (!apiKey || !token) return null;
  return { ...client, slug, apiKey, token };
}
