import { config } from '@/globals/config';
import { getRedirectUri } from '@/helpers/api-helpers';
import { getSession, setSession } from '@/lib/session';
import { validateRequest } from '@/lib/validation';
import { OAuthAPI } from '@ikas/admin-api-client';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import z from 'zod';

const authorizeSchema = z.object({
  storeName: z.string().min(1, 'storeName is required'),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url as string, `http://${request.headers.get('host')}`);
    const { searchParams } = url;

    const validation = validateRequest(authorizeSchema, {
      storeName: searchParams.get('storeName'),
    });

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { storeName } = validation.data;

    const state = randomBytes(32).toString('base64url');

    const session = await getSession();
    session.state = state;
    session.storeName = storeName;

    await setSession(session);

    const oauthBaseUrl = OAuthAPI.getOAuthUrl({ storeName });

    const authorizeUrl =
      `${oauthBaseUrl}/authorize` +
      `?client_id=${encodeURIComponent(config.oauth.clientId!)}` +
      `&redirect_uri=${encodeURIComponent(getRedirectUri(request.headers.get('host')!))}` +
      `&scope=${encodeURIComponent(config.oauth.scope)}` +
      `&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error('Authorize error:', error);
    return NextResponse.json({ error: 'Authorization failed' }, { status: 500 });
  }
}
