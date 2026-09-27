import { isTokenExpired, refreshAuthToken } from '@/helpers/api-helpers';
import type { AuthToken } from '@/models/auth-token';
import { classifyRefreshFailure, type TokenHealth } from './classify';

export { isMassRevocation, type TokenHealth } from './classify';

const RETRY_DELAY_MS = 3000;

type ErrorWithResponse = { response?: { status?: unknown; data?: { error?: unknown } } };

async function refreshOnce(token: AuthToken): Promise<TokenHealth> {
  if (!isTokenExpired(token)) return 'ok';
  try {
    await refreshAuthToken(token);
    return 'ok';
  } catch (error) {
    const response = error && typeof error === 'object' ? (error as ErrorWithResponse).response : undefined;
    const status = typeof response?.status === 'number' ? response.status : undefined;
    const oauthError = response?.data?.error;
    return classifyRefreshFailure(status, typeof oauthError === 'string' ? oauthError : undefined);
  }
}

export async function refreshIfExpired(token: AuthToken): Promise<TokenHealth> {
  const first = await refreshOnce(token);
  if (first !== 'revoked') return first;
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  const second = await refreshOnce(token);
  return second === 'revoked' ? 'revoked' : second === 'ok' ? 'ok' : 'unknown';
}
