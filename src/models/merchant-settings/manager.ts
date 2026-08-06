import { prisma } from '@/lib/prisma';
import { derivePublicKey } from '@/lib/public-key';
import type { Appearance } from '@/lib/campaigns/appearance';
import type { MerchantSettings } from './index';

export class MerchantSettingsManager {
  private static toModel(db: any): MerchantSettings {
    let defaultAppearance: Partial<Appearance> = {};
    try {
      const parsed = JSON.parse(db.defaultAppearance || '{}');
      if (parsed && typeof parsed === 'object') defaultAppearance = parsed;
    } catch {
      defaultAppearance = {};
    }
    return {
      authorizedAppId: db.authorizedAppId,
      merchantId: db.merchantId,
      publicKey: db.publicKey,
      defaultAppearance,
      createdAt: new Date(db.createdAt).toISOString(),
      updatedAt: new Date(db.updatedAt).toISOString(),
    };
  }

  static async ensure(authorizedAppId: string, merchantId: string): Promise<MerchantSettings> {
    const publicKey = derivePublicKey(authorizedAppId);
    const row = await prisma.merchantSettings.upsert({
      where: { authorizedAppId },
      update: { merchantId, publicKey },
      create: { authorizedAppId, merchantId, publicKey },
    });
    return this.toModel(row);
  }

  static async getByPublicKey(publicKey: string): Promise<MerchantSettings | undefined> {
    const row = await prisma.merchantSettings.findUnique({ where: { publicKey } });
    return row ? this.toModel(row) : undefined;
  }

  static async get(authorizedAppId: string): Promise<MerchantSettings | undefined> {
    const row = await prisma.merchantSettings.findUnique({ where: { authorizedAppId } });
    return row ? this.toModel(row) : undefined;
  }

  static async saveDefaultAppearance(authorizedAppId: string, appearance: Partial<Appearance>): Promise<void> {
    await prisma.merchantSettings.update({
      where: { authorizedAppId },
      data: { defaultAppearance: JSON.stringify(appearance) },
    });
  }
}
