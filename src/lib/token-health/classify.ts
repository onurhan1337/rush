/**
 * Pure classification for the daily token health check's refresh step. Only an
 * unambiguous "this refresh token is no longer valid" answer from ikas is 'revoked'.
 * A removed app is detected by kanca.checkInstalls (getAuthorizedApp returns null).
 */
export type TokenHealth = 'ok' | 'revoked' | 'unknown';

// OAuth errors about the grant itself. 'invalid_client' / 'unauthorized_client'
// are about rush's own credentials and would hit every store, so they stay unknown.
const REVOKED_REFRESH_ERRORS = new Set(['invalid_grant', 'unauthorized']);

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
