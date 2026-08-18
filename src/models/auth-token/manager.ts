import { AuthToken } from './index';
import { prisma } from '@/lib/prisma';

export class AuthTokenManager {
  private static toModel(db: any): AuthToken {
    return {
      id: db.id,
      merchantId: db.merchantId,
      authorizedAppId: db.authorizedAppId ?? undefined,
      salesChannelId: db.salesChannelId ?? null,
      type: db.type ?? undefined,
      createdAt: db.createdAt ? new Date(db.createdAt).toISOString() : undefined,
      updatedAt: db.updatedAt ? new Date(db.updatedAt).toISOString() : undefined,
      deleted: db.deleted ?? false,
      accessToken: db.accessToken,
      tokenType: db.tokenType,
      expiresIn: db.expiresIn,
      expireDate: new Date(db.expireDate).toISOString(),
      refreshToken: db.refreshToken,
      scope: db.scope ?? undefined,
    };
  }
  static async get(authorizedAppId: string): Promise<AuthToken | undefined> {
    const token = await prisma.authToken.findUnique({
      where: { authorizedAppId },
    });
    return token ? this.toModel(token) : undefined;
  }

  static async put(token: AuthToken): Promise<AuthToken> {
    const upserted = await prisma.authToken.upsert({
      where: { id: token.id },
      update: {
        merchantId: token.merchantId,
        salesChannelId: token.salesChannelId || undefined,
        type: token.type,
        deleted: token.deleted ?? false,
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        expiresIn: token.expiresIn,
        expireDate: new Date(token.expireDate),
        refreshToken: token.refreshToken,
        scope: token.scope,
      },
      create: {
        id: token.id,
        authorizedAppId: token.authorizedAppId,
        merchantId: token.merchantId,
        salesChannelId: token.salesChannelId || undefined,
        type: token.type,
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        expiresIn: token.expiresIn,
        expireDate: new Date(token.expireDate),
        refreshToken: token.refreshToken,
        scope: token.scope,
      },
    });
    return this.toModel(upserted);
  }

  static async delete(authorizedAppId: string): Promise<void> {
    const existing = await prisma.authToken.findUnique({ where: { authorizedAppId } });
    if (!existing) {
      throw new Error('Token not found');
    }
    await prisma.authToken.update({
      where: { authorizedAppId },
      data: { deleted: true },
    });
  }

  static async list(): Promise<AuthToken[]> {
    const tokens = await prisma.authToken.findMany();
    return tokens.map(AuthTokenManager.toModel);
  }
}
