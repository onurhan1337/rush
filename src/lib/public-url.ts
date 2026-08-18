import { config } from '@/globals/config';

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
