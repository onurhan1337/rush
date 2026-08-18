import { NextResponse } from 'next/server';
import { withMerchant } from '@/lib/api-route-helpers';
import { REQUIRED_SCOPES } from '@/globals/config';

export type ScopeApiResponse = {
  granted: string[];
  missing: string[];
  required: string[];
};

function normalizeScope(scope: string): string {
  return scope.trim().toLowerCase().replace(/s$/, '');
}

export const GET = withMerchant(async (_request, context) => {
  const granted = (context.authToken.scope ?? '')
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  const grantedSet = new Set(granted.map(normalizeScope));
  const missing = REQUIRED_SCOPES.filter((scope) => !grantedSet.has(normalizeScope(scope)));

  return NextResponse.json({ data: { granted, missing, required: [...REQUIRED_SCOPES] } });
});
