import type { Appearance } from '@/lib/campaigns/appearance';

export interface MerchantSettings {
  authorizedAppId: string;
  merchantId: string;
  publicKey: string;
  defaultAppearance: Partial<Appearance>;
  createdAt: string;
  updatedAt: string;
}
