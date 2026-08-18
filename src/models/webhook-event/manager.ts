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

  static async prune(): Promise<void> {
    const threshold = new Date(Date.now() - RETENTION_DAYS * 86400_000);
    try {
      await prisma.webhookEvent.deleteMany({ where: { receivedAt: { lt: threshold } } });
    } catch (error) {
      console.error('Webhook event prune failed:', error);
    }
  }
}
