/**
 * Pure classification for the daily token health check. Deliberately
 * conservative: only an unambiguous "this token is no longer valid" answer
 * from ikas is 'revoked' (a removed app is detected in index.ts: ikas keeps
 * the token working but getAuthorizedApp returns null). Network errors, 5xx, 429, 403 and anything
 * unexpected are 'unknown' and never lead to an uninstall.
 */
export type TokenHealth = 'ok' | 'revoked' | 'unknown';

const REVOKED_GRAPHQL_CODES = new Set(['UNAUTHENTICATED', 'UNAUTHORIZED', 'LOGIN_REQUIRED', 'INVALID_TOKEN']);

// OAuth errors about the grant itself. 'invalid_client' / 'unauthorized_client'
// are about rush's own credentials and would hit every store, so they stay unknown.
const REVOKED_REFRESH_ERRORS = new Set(['invalid_grant', 'unauthorized']);

/** A failed Admin API call: HTTP status (undefined for network errors) and GraphQL error codes. */
export function classifyApiFailure(status: number | undefined, codes: string[]): TokenHealth {
  if (status === 401) return 'revoked';
  // GraphQL error codes only count on a 2xx answer; a 5xx/429 is never trusted.
  const answered = status !== undefined && status >= 200 && status < 300;
  if (answered && codes.some((code) => REVOKED_GRAPHQL_CODES.has(code.toUpperCase()))) return 'revoked';
  return 'unknown';
}

/** A failed OAuth refresh: HTTP status (undefined for network errors) and the OAuth `error` field. */
export function classifyRefreshFailure(status: number | undefined, oauthError: string | undefined): TokenHealth {
  if (status !== 400 && status !== 401) return 'unknown';
  if (oauthError && REVOKED_REFRESH_ERRORS.has(oauthError.toLowerCase())) return 'revoked';
  return 'unknown';
}

/**
 * Safety valve against a systemic failure (e.g. an ikas auth outage) wiping
 * every store: refuse to act when most checked stores look revoked at once.
 */
export function isMassRevocation(revoked: number, checked: number): boolean {
  return revoked >= 5 && revoked * 2 > checked;
}
