import { getIkas, isTokenExpired, refreshAuthToken } from '@/helpers/api-helpers';
import type { AuthToken } from '@/models/auth-token';
import { classifyApiFailure, classifyRefreshFailure, type TokenHealth } from './classify';

export { isMassRevocation, type TokenHealth } from './classify';

// Same operation as the generated getAuthorizedApp query, trimmed to one field.
// Sent through the raw graphql-request client because the generated query
// methods drop the HTTP status: @ikas/admin-api-client turns a 401 into
// `new APIResult({ errors: undefined })`, which reads as isSuccess === true.
const PROBE_QUERY = `
  query getAuthorizedApp {
    getAuthorizedApp {
      id
    }
  }
`;

const RETRY_DELAY_MS = 3000;

type ErrorWithResponse = {
  response?: {
    status?: unknown;
    errors?: { message?: string; extensions?: { code?: unknown } }[];
    data?: { error?: unknown };
  };
};

function responseOf(error: unknown): ErrorWithResponse['response'] {
  return error && typeof error === 'object' ? (error as ErrorWithResponse).response : undefined;
}

function statusOf(error: unknown): number | undefined {
  const status = responseOf(error)?.status;
  return typeof status === 'number' ? status : undefined;
}

async function checkOnce(token: AuthToken): Promise<TokenHealth> {
  if (isTokenExpired(token)) {
    try {
      await refreshAuthToken(token);
    } catch (error) {
      const oauthError = responseOf(error)?.data?.error;
      return classifyRefreshFailure(statusOf(error), typeof oauthError === 'string' ? oauthError : undefined);
    }
  }

  // getIkas keeps the call instrumented by Kanca; the token is fresh, so onCheckToken is a no-op.
  const ikas = getIkas(token);
  try {
    const data = (await ikas._client.request({ document: PROBE_QUERY })) as { getAuthorizedApp?: { id?: string } | null };
    return data?.getAuthorizedApp?.id ? 'ok' : 'unknown';
  } catch (error) {
    const errors = responseOf(error)?.errors;
    const codes = Array.isArray(errors) ? errors.map((item) => String(item?.extensions?.code ?? '')).filter(Boolean) : [];
    return classifyApiFailure(statusOf(error), codes);
  }
}

/**
 * Checks one store's token with a cheap Admin API read. A 'revoked' result is
 * only returned when a second check ~3s later agrees, so a single blip never
 * uninstalls a store.
 */
export async function checkTokenHealth(token: AuthToken): Promise<TokenHealth> {
  const first = await checkOnce(token);
  if (first !== 'revoked') return first;

  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  const second = await checkOnce(token);
  return second === 'revoked' ? 'revoked' : second === 'ok' ? 'ok' : 'unknown';
}
