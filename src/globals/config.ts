export const REQUIRED_SCOPES = [
  'read_orders',
  'write_orders',
  'read_products',
  'read_inventories',
  'write_inventories',
  // ikas returns this one pluralised in the OAuth scope string, even though
  // AppScopeEnum spells it WRITE_STOREFRONT.
  'write_storefronts',
  'read_campaigns',
  'write_campaigns',
] as const;

// A trailing slash here becomes a double slash in the redirect_uri, which no
// longer matches the URI registered with ikas and fails the token exchange.
const deployUrl = (process.env.NEXT_PUBLIC_DEPLOY_URL ?? '').replace(/\/+$/, '');

export const config = {
  // Graph API and Store config
  graphApiUrl: process.env.NEXT_PUBLIC_GRAPH_API_URL,
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL,
  cookiePassword: process.env.SECRET_COOKIE_PASSWORD,

  // Public URL the storefront script and public endpoints are served from
  deployUrl,

  // Secret used to derive per-merchant public keys for the storefront widget
  publicKeySecret: process.env.RUSH_PUBLIC_KEY_SECRET,

  // OAuth configuration
  oauth: {
    scope: REQUIRED_SCOPES.join(','),
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: `${deployUrl}/api/oauth/callback/ikas`,
  },
};

export type Config = typeof config;
