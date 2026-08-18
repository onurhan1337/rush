import { OAuthAPI } from '@ikas/admin-api-client';
import moment from 'moment';
import { AuthToken } from '../models/auth-token';
import { AuthTokenManager } from '../models/auth-token/manager';
import { ikasAdminGraphQLAPIClient } from '../lib/ikas-client/generated/graphql';
import { config } from '../globals/config';

export function getIkas(token: AuthToken): ikasAdminGraphQLAPIClient<AuthToken> {
  return new ikasAdminGraphQLAPIClient<AuthToken>({
    graphApiUrl: config.graphApiUrl!,
    accessToken: token.accessToken,
    tokenData: token,
    onCheckToken: () => onCheckToken(token),
  });
}

export async function onCheckToken(token?: AuthToken): Promise<{ accessToken: string | undefined; tokenData?: AuthToken }> {
  try {
    if (!token) {
      return { accessToken: undefined };
    }

    const now = new Date();
    const expireDate = new Date(token.expireDate);

    if (now.getTime() >= expireDate.getTime()) {
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

      if (response.data) {
        const newExpireDate = moment().add(response.data.expires_in, 'seconds').toDate().toISOString();

        token.accessToken = response.data.access_token;
        token.refreshToken = response.data.refresh_token;
        token.tokenType = response.data.token_type;
        token.expiresIn = response.data.expires_in;
        token.expireDate = newExpireDate;

        await AuthTokenManager.put(token);

        return { accessToken: token.accessToken, tokenData: token };
      }
    }

    return { accessToken: undefined };
  } catch (error) {
    console.error('Failed to check or refresh token:', error);
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
