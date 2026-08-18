import { config } from '@/globals/config';
import { getSession, setSession } from '@/lib/session';
import { validateRequest } from '@/lib/validation';
import { OAuthAPI } from '@ikas/admin-api-client';
import moment from 'moment';
import { getIkas, getRedirectUri } from '@/helpers/api-helpers';
import { JwtHelpers } from '@/helpers/jwt-helpers';
import { TokenHelpers } from '@/helpers/token-helpers';
import { AuthToken } from '@/models/auth-token';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import z from 'zod';

const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  storeName: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  signature: z.string().optional(),
});

type TokenExchangeDetail = {
  storeName: string;
  redirectUri: string;
  status?: number;
  body?: unknown;
};

class TokenExchangeError extends Error {
  constructor(readonly detail: TokenExchangeDetail) {
    super('Token exchange failed');
    this.name = 'TokenExchangeError';
  }
}

function statesMatch(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url as string, `http://${request.headers.get('host')}`);
    const { searchParams } = url;

    const validation = validateRequest(callbackSchema, {
      code: searchParams.get('code'),
      storeName: searchParams.get('storeName') || undefined,
      state: searchParams.get('state') || undefined,
      signature: searchParams.get('signature') || undefined,
    });

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { code, storeName: storeNameParam, state, signature } = validation.data;

    if (signature && !TokenHelpers.validateCodeSignature(code, signature, config.oauth.clientSecret!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const session = await getSession();
    if (session.state) {
      if (!state || !statesMatch(session.state, state)) {
        return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
      }
      session.state = undefined;
      await setSession(session);
    }

    const storeName = storeNameParam || (session.storeName as string | undefined) || 'api';
    const redirectUri = getRedirectUri(request.headers.get('host')!);

    const tokenResponse = await OAuthAPI.getTokenWithAuthorizationCode(
      {
        code: code as string,
        client_id: config.oauth.clientId!,
        client_secret: config.oauth.clientSecret!,
        redirect_uri: redirectUri,
      },
      { storeName },
    ).catch((error) => {
      const response = (error as { response?: { status?: number; data?: unknown } }).response;
      throw new TokenExchangeError({ storeName, redirectUri, status: response?.status, body: response?.data });
    });

    if (!tokenResponse.data) {
      return NextResponse.json({ error: { statusCode: 500, message: 'Failed to retrieve token' } }, { status: 500 });
    }

    const tokenTemp: Partial<AuthToken> = {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      tokenType: tokenResponse.data.token_type,
      expiresIn: tokenResponse.data.expires_in,
      expireDate: '',
      scope: tokenResponse.data.scope,
      salesChannelId: null,
    };

    const ikas = getIkas(tokenTemp as AuthToken);

    const [merchantResponse, authorizedAppResponse] = await Promise.all([ikas.queries.getMerchant(), ikas.queries.getAuthorizedApp()]);

    if (
      !merchantResponse.isSuccess ||
      !merchantResponse.data ||
      !authorizedAppResponse.isSuccess ||
      !authorizedAppResponse.data ||
      !authorizedAppResponse.data.getAuthorizedApp ||
      !merchantResponse.data.getMerchant
    ) {
      return NextResponse.json(
        {
          error: { statusCode: 403, message: 'Unable to retrieve merchant or authorized app' },
        },
        { status: 403 },
      );
    }

    const authorizedAppId = authorizedAppResponse.data.getAuthorizedApp.id!;
    const merchantId = merchantResponse.data.getMerchant.id!;
    const expireDate = moment().add(tokenResponse.data.expires_in, 'seconds').toDate().toISOString();

    const token: AuthToken = {
      ...tokenTemp,
      id: authorizedAppId,
      authorizedAppId,
      merchantId,
      expireDate,
      salesChannelId: authorizedAppResponse.data.getAuthorizedApp.salesChannelId || null,
    } as AuthToken;

    await AuthTokenManager.put(token);

    session.expiresAt = new Date(Date.now() + 3600 * 1000);
    session.merchantId = merchantId;
    session.authorizedAppId = authorizedAppId;

    await setSession(session);

    const jwtToken = JwtHelpers.createToken(merchantId, authorizedAppId);

    const redirectUrl = `${config.adminUrl!.replace(
      '{storeName}',
      merchantResponse.data.getMerchant.storeName as string,
    )}/authorized-app/${authorizedAppId}`;

    const callbackUrl = new URLSearchParams();
    callbackUrl.set('token', jwtToken);
    callbackUrl.set('redirectUrl', redirectUrl);
    callbackUrl.set('authorizedAppId', authorizedAppId);

    return NextResponse.redirect(new URL(`/callback?${callbackUrl.toString()}`, getRedirectUri(request.headers.get('host')!)));
  } catch (error) {
    if (error instanceof TokenExchangeError) {
      console.error('Token exchange failed:', error.detail);
      return NextResponse.json({ error: { statusCode: 400, message: 'Token exchange failed', ...error.detail } }, { status: 400 });
    }

    console.error('Callback error:', error);
    return NextResponse.json({ error: { statusCode: 500, message: 'Callback failed' } }, { status: 500 });
  }
}
