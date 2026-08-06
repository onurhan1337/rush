import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { StorefrontScript } from './index';

export class StorefrontScriptManager {
  private static toModel(db: any): StorefrontScript {
    return {
      id: db.id,
      authorizedAppId: db.authorizedAppId,
      storefrontId: db.storefrontId,
      scriptId: db.scriptId,
      version: db.version ?? '',
      installedAt: new Date(db.installedAt).toISOString(),
      updatedAt: new Date(db.updatedAt).toISOString(),
      deleted: db.deleted ?? false,
    };
  }

  static async get(authorizedAppId: string, storefrontId: string): Promise<StorefrontScript | undefined> {
    const row = await prisma.storefrontScript.findUnique({
      where: { authorizedAppId_storefrontId: { authorizedAppId, storefrontId } },
    });
    return row ? this.toModel(row) : undefined;
  }

  static async put(input: { authorizedAppId: string; storefrontId: string; scriptId: string; version: string }): Promise<StorefrontScript> {
    const row = await prisma.storefrontScript.upsert({
      where: { authorizedAppId_storefrontId: { authorizedAppId: input.authorizedAppId, storefrontId: input.storefrontId } },
      update: { scriptId: input.scriptId, version: input.version, deleted: false },
      create: { id: randomUUID(), ...input },
    });
    return this.toModel(row);
  }

  static async list(authorizedAppId: string): Promise<StorefrontScript[]> {
    const rows = await prisma.storefrontScript.findMany({ where: { authorizedAppId, deleted: false } });
    return rows.map((row) => StorefrontScriptManager.toModel(row));
  }

  static async markDeleted(authorizedAppId: string, storefrontId: string): Promise<void> {
    await prisma.storefrontScript.updateMany({
      where: { authorizedAppId, storefrontId },
      data: { deleted: true },
    });
  }
}
