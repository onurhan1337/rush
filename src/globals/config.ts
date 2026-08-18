export const REQUIRED_SCOPES = [
  'read_orders',
  'write_orders',
  'read_products',
  'read_inventories',
  'write_inventories',
  'write_storefronts',
  'read_campaigns',
  'write_campaigns',
] as const;

const deployUrl = (process.env.NEXT_PUBLIC_DEPLOY_URL ?? '').replace(/\/+$/, '');

export const config = {
  graphApiUrl: process.env.NEXT_PUBLIC_GRAPH_API_URL,
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL,
  cookiePassword: process.env.SECRET_COOKIE_PASSWORD,

  deployUrl,

  publicKeySecret: process.env.RUSH_PUBLIC_KEY_SECRET,

  oauth: {
    scope: REQUIRED_SCOPES.join(','),
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: `${deployUrl}/api/oauth/callback/ikas`,
  },
};

export type Config = typeof config;
