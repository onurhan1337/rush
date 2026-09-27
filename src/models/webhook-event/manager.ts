import { prisma } from '@/lib/prisma';

const RETENTION_DAYS = 30;

export class WebhookEventManager {
  static async markProcessed(id: string, scope: string): Promise<boolean> {
    try {
      await prisma.webhookEvent.create({ data: { id, scope } });
      return true;
    } catch {
      return false;
    }
  }

  static async unmark(id: string): Promise<void> {
    await prisma.webhookEvent.deleteMany({ where: { id } });
  }

  /**
   * Marker rows (id prefixed, e.g. `rush:webhooks:<appId>:<version>`) reuse this
   * table as a cheap "last done at" record. They never collide with ikas
   * delivery ids, which are UUIDs.
   */
  static async markerAge(id: string): Promise<number | undefined> {
    const row = await prisma.webhookEvent.findUnique({ where: { id } });
    return row ? Date.now() - row.receivedAt.getTime() : undefined;
  }

  static async touchMarker(id: string, scope: string): Promise<void> {
    await prisma.webhookEvent.upsert({
      where: { id },
      update: { receivedAt: new Date() },
      create: { id, scope },
    });
  }

  static async clearMarkers(idPrefix: string): Promise<void> {
    await prisma.webhookEvent.deleteMany({ where: { id: { startsWith: idPrefix } } });
  }

  static async prune(): Promise<void> {
    const threshold = new Date(Date.now() - RETENTION_DAYS * 86400_000);
    try {
      await prisma.webhookEvent.deleteMany({ where: { receivedAt: { lt: threshold } } });
    } catch (error) {
      console.error('Webhook event prune failed:', error);
    }
  }
}
