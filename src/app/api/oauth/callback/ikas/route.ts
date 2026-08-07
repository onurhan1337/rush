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
import z from 'zod';

const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  storeName: z.string().min(1).optional(),
  state: z.string().optional(),
  signature: z.string().optional(),
});

type TokenExchangeDetail = {
  storeName: string;
  redirectUri: string;
  status?: number;
  body?: unknown;
};

/**
 * Carries the ikas rejection reason out of the token exchange so the callback can
 * report it instead of a bare "Callback failed", which says nothing actionable.
 */
class TokenExchangeError extends Error {
  constructor(readonly detail: TokenExchangeDetail) {
    super('Token exchange failed');
    this.name = 'TokenExchangeError';
  }
}

/**
 * Handles the OAuth callback for Ikas.
 * Validates code signature, optionally validates state for CSRF protection,
 * exchanges the authorization code for tokens, updates session, and redirects.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse the request URL to extract query parameters
    const url = new URL(request.url as string, `http://${request.headers.get('host')}`);
    const { searchParams } = url;

    // Validate the incoming request parameters (code, state, signature)
    const validation = validateRequest(callbackSchema, {
      code: searchParams.get('code'),
      storeName: searchParams.get('storeName') || undefined,
      state: searchParams.get('state') || undefined,
      signature: searchParams.get('signature') || undefined,
    });

    if (!validation.success) {
      // Invalid parameters
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { code, storeName: storeNameParam, state, signature } = validation.data;

    // Validate code signature
    if (signature &&!TokenHelpers.validateCodeSignature(code, signature, config.oauth.clientSecret!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Retrieve session and optionally check state for CSRF protection
    const session = await getSession();
    if (state && session.state && session.state !== state) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    // ikas echoes storeName back on the callback. Prefer it over the session: the
    // OAuth flow can run inside the Admin iframe, where the cookie written during
    // authorize is a third-party cookie and never makes it back here. Falling back
    // to 'api' would post the code to the wrong store host and earn a 400.
    const storeName = storeNameParam || (session.storeName as string | undefined) || 'api';
    const redirectUri = getRedirectUri(request.headers.get('host')!);

    // Exchange authorization code for access/refresh tokens
    const tokenResponse = await OAuthAPI.getTokenWithAuthorizationCode(
      {
        code: code as string,
        client_id: config.oauth.clientId!,
        client_secret: config.oauth.clientSecret!,
        redirect_uri: redirectUri,
      },
      { storeName },
    ).catch((error) => {
      // The SDK throws on non-2xx, and the ikas error body is the only thing that
      // says *why* (invalid_client, invalid_grant, redirect_uri mismatch...). Neither
      // the code nor the secret is echoed back, so this is safe to surface.
      const response = (error as { response?: { status?: number; data?: unknown } }).response;
      throw new TokenExchangeError({ storeName, redirectUri, status: response?.status, body: response?.data });
    });

    if (!tokenResponse.data) {
      // Failed to get token
      return NextResponse.json({ error: { statusCode: 500, message: 'Failed to retrieve token' } }, { status: 500 });
    }

    // Prepare a temporary token object
    const tokenTemp: Partial<AuthToken> = {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      tokenType: tokenResponse.data.token_type,
      expiresIn: tokenResponse.data.expires_in,
      expireDate: '',
      scope: tokenResponse.data.scope,
      salesChannelId: null,
    };

    // Create an Ikas client with the new token
    const ikas = getIkas(tokenTemp as AuthToken);

    // Fetch merchant and authorized app details
    const [merchantResponse, authorizedAppResponse] = await Promise.all([ikas.queries.getMerchant(), ikas.queries.getAuthorizedApp()]);

    // Validate responses
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

    // Extract necessary IDs and calculate token expiration date
    const authorizedAppId = authorizedAppResponse.data.getAuthorizedApp.id!;
    const merchantId = merchantResponse.data.getMerchant.id!;
    const expireDate = moment().add(tokenResponse.data.expires_in, 'seconds').toDate().toISOString();

    // Build the final AuthToken object
    const token: AuthToken = {
      ...tokenTemp,
      id: authorizedAppId,
      authorizedAppId,
      merchantId,
      expireDate,
      salesChannelId: authorizedAppResponse.data.getAuthorizedApp.salesChannelId || null,
    } as AuthToken;

    // Store the token for future use
    await AuthTokenManager.put(token);

    // Update session with new merchant and app IDs, clear state, and set expiration
    session.expiresAt = new Date(Date.now() + 3600 * 1000);
    session.merchantId = merchantId;
    session.authorizedAppId = authorizedAppId;
    delete session.state;

    // Save updated session
    await setSession(session);

    // Create a JWT for the merchant and authorized app
    const jwtToken = JwtHelpers.createToken(merchantId, authorizedAppId);

    // Build the redirect URL for the admin panel
    const redirectUrl = `${config.adminUrl!.replace(
      '{storeName}',
      merchantResponse.data.getMerchant.storeName as string,
    )}/authorized-app/${authorizedAppId}`;

    // Build the callback URL with token and redirect info
    const callbackUrl = new URLSearchParams();
    callbackUrl.set('token', jwtToken);
    callbackUrl.set('redirectUrl', redirectUrl);
    callbackUrl.set('authorizedAppId', authorizedAppId);

    // Redirect the user to the callback URL
    return NextResponse.redirect(new URL(`/callback?${callbackUrl.toString()}`, getRedirectUri(request.headers.get('host')!)));
  } catch (error) {
    if (error instanceof TokenExchangeError) {
      console.error('Token exchange failed:', error.detail);
      return NextResponse.json({ error: { statusCode: 400, message: 'Token exchange failed', ...error.detail } }, { status: 400 });
    }

    // Log and return error response
    console.error('Callback error:', error);
    return NextResponse.json({ error: { statusCode: 500, message: 'Callback failed' } }, { status: 500 });
  }
}
