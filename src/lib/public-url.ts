import { config } from '@/globals/config';

/**
 * Resolves the URL a storefront (or any third party) can actually reach us on.
 *
 * In development NEXT_PUBLIC_DEPLOY_URL is localhost, which a storefront running on
 * https://<store>.myikas.com can never load — browsers block loopback from a public
 * origin. When that happens we fall back to the host the request arrived on, which is
 * the tunnel domain the ikas dashboard loaded the app from.
 */
export function getPublicBaseUrl(request: Request): string {
  const configured = config.deployUrl?.replace(/\/$/, '');
  if (configured && !isLocal(configured)) return configured;

  const host = request.headers.get('host');
  if (host && !isLocal(host)) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    return `${proto}://${host}`;
  }

  return configured ?? (host ? `http://${host}` : '');
}

function isLocal(value: string): boolean {
  return /localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0/.test(value);
}
