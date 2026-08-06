import crypto from 'crypto';
import { config } from '@/globals/config';

export function derivePublicKey(authorizedAppId: string): string {
  const secret = config.publicKeySecret;
  if (!secret) throw new Error('RUSH_PUBLIC_KEY_SECRET is not configured');
  return crypto.createHmac('sha256', secret).update(authorizedAppId, 'utf8').digest('hex').slice(0, 32);
}

export function isValidPublicKeyFormat(key: string | null | undefined): key is string {
  return !!key && /^[a-f0-9]{32}$/.test(key);
}
