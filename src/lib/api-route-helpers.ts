import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { MerchantSettingsManager } from '@/models/merchant-settings/manager';
import type { AuthToken } from '@/models/auth-token';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

export type MerchantContext = {
  authorizedAppId: string;
  merchantId: string;
  authToken: AuthToken;
  ikas: ikasAdminGraphQLAPIClient<AuthToken>;
};

type Handler<TParams> = (request: NextRequest, context: MerchantContext, params: TParams) => Promise<NextResponse>;

export function apiError(statusCode: number, message: string) {
  return NextResponse.json({ error: { statusCode, message } }, { status: statusCode });
}

async function resolveMerchant(request: NextRequest): Promise<MerchantContext | NextResponse> {
  const user = getUserFromRequest(request);
  if (!user) return apiError(401, 'Unauthorized');

  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken || authToken.deleted) {
    console.error('Auth token not found for authorizedAppId:', user.authorizedAppId, authToken?.deleted ? '(uninstalled)' : '(missing)');
    return apiError(404, 'Auth token not found');
  }

  return {
    authorizedAppId: user.authorizedAppId,
    merchantId: user.merchantId,
    authToken,
    ikas: getIkas(authToken),
  };
}

export function withMerchant(handler: (request: NextRequest, context: MerchantContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const merchant = await resolveMerchant(request);
      if (merchant instanceof NextResponse) return merchant;
      return await handler(request, merchant);
    } catch (error) {
      console.error('API route failed:', error);
      return apiError(500, 'Beklenmeyen bir hata oluştu');
    }
  };
}

export function withMerchantParams<TParams>(handler: Handler<TParams>) {
  return async (request: NextRequest, routeContext: { params: Promise<TParams> }): Promise<NextResponse> => {
    try {
      const merchant = await resolveMerchant(request);
      if (merchant instanceof NextResponse) return merchant;
      return await handler(request, merchant, await routeContext.params);
    } catch (error) {
      console.error('API route failed:', error);
      return apiError(500, 'Beklenmeyen bir hata oluştu');
    }
  };
}

export async function ensureSettings(context: MerchantContext) {
  return MerchantSettingsManager.ensure(context.authorizedAppId, context.merchantId);
}
