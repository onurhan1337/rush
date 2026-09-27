import { OAuthAPI } from '@ikas/admin-api-client';
import moment from 'moment';
import { AuthToken } from '../models/auth-token';
import { AuthTokenManager } from '../models/auth-token/manager';
import { ikasAdminGraphQLAPIClient } from '../lib/ikas-client/generated/graphql';
import { config } from '../globals/config';
import { kanca } from '../lib/kanca';

export function getIkas(token: AuthToken): ikasAdminGraphQLAPIClient<AuthToken> {
  return kanca.instrument(
    new ikasAdminGraphQLAPIClient<AuthToken>({
      graphApiUrl: config.graphApiUrl!,
      accessToken: token.accessToken,
      tokenData: token,
      onCheckToken: () => onCheckToken(token),
    }),
  );
}

export function isTokenExpired(token: AuthToken, now = new Date()): boolean {
  return now.getTime() >= new Date(token.expireDate).getTime();
}

/**
 * Exchanges the refresh token for a new access token and persists it. Throws
 * on failure (an axios error carrying ikas' OAuth response when ikas rejected it).
 */
export async function refreshAuthToken(token: AuthToken): Promise<AuthToken> {
  const response = await OAuthAPI.refreshToken(
    {
      refresh_token: token.refreshToken,
      client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
    },
    {
      storeName: 'api',
    },
  );

  if (!response.data) {
    throw new Error('Token refresh returned no data');
  }

  const newExpireDate = moment().add(response.data.expires_in, 'seconds').toDate().toISOString();

  token.accessToken = response.data.access_token;
  token.refreshToken = response.data.refresh_token;
  token.tokenType = response.data.token_type;
  token.expiresIn = response.data.expires_in;
  token.expireDate = newExpireDate;

  await AuthTokenManager.put(token);

  return token;
}

export async function onCheckToken(token?: AuthToken): Promise<{ accessToken: string | undefined; tokenData?: AuthToken }> {
  try {
    if (!token) {
      return { accessToken: undefined };
    }

    if (isTokenExpired(token)) {
      await refreshAuthToken(token);
      return { accessToken: token.accessToken, tokenData: token };
    }

    return { accessToken: undefined };
  } catch (error) {
    // Never log the raw axios error: its request config carries client_secret and refresh_token.
    const status = (error as { response?: { status?: number } })?.response?.status;
    const code = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
    console.error('Failed to check or refresh token:', status ?? 'no status', code ?? (error instanceof Error ? error.message : 'unknown'));
    return { accessToken: undefined };
  }
}

export const getRedirectUri = (host: string) => {
  if (config.oauth.redirectUri.includes('localhost') && !host.includes('localhost')) {
    const redirectUri = new URL(config.oauth.redirectUri);
    redirectUri.host = host;
    redirectUri.protocol = 'https';
    redirectUri.port = '443';
    return redirectUri.toString();
  }

  return config.oauth.redirectUri;
};
