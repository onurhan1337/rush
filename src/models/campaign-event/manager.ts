import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { STAT_FIELD_BY_EVENT, type CampaignEventType, type CampaignStat } from './index';

const RAW_EVENT_RETENTION_DAYS = 30;

export type IncomingEvent = {
  campaignId: string;
  type: CampaignEventType;
  sessionId: string;
  variantId?: string;
  value?: number;
};

type Bucket = { impressions: number; opens: number; clicks: number; addToCarts: number; dismisses: number; revenue: number };

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function emptyBucket(): Bucket {
  return { impressions: 0, opens: 0, clicks: 0, addToCarts: 0, dismisses: 0, revenue: 0 };
}

function hasValue(bucket: Bucket): boolean {
  return Object.values(bucket).some((value) => value > 0);
}

export class CampaignEventManager {
  static async record(authorizedAppId: string, events: IncomingEvent[]): Promise<number> {
    if (!events.length) return 0;

    const day = startOfUtcDay(new Date());
    const sessionIds = Array.from(new Set(events.map((event) => event.sessionId)));
    const campaignIds = Array.from(new Set(events.map((event) => event.campaignId)));

    const alreadyCounted = await prisma.campaignEvent.findMany({
      where: { sessionId: { in: sessionIds }, campaignId: { in: campaignIds }, createdAt: { gte: day } },
      select: { sessionId: true, campaignId: true, type: true },
    });

    const counted = new Set(alreadyCounted.map((row) => `${row.sessionId}|${row.campaignId}|${row.type}`));

    await prisma.campaignEvent.createMany({
      data: events.map((event) => ({
        id: randomUUID(),
        campaignId: event.campaignId,
        authorizedAppId,
        type: event.type,
        sessionId: event.sessionId,
        variantId: event.variantId ?? null,
        value: typeof event.value === 'number' ? event.value : null,
      })),
    });

    const buckets = new Map<string, Bucket>();
    for (const event of events) {
      const bucket = buckets.get(event.campaignId) ?? emptyBucket();
      buckets.set(event.campaignId, bucket);

      if (event.type === 'ADD_TO_CART' && typeof event.value === 'number') bucket.revenue += event.value;

      const key = `${event.sessionId}|${event.campaignId}|${event.type}`;
      if (counted.has(key)) continue;

      counted.add(key);
      bucket[STAT_FIELD_BY_EVENT[event.type]] += 1;
    }

    for (const [campaignId, bucket] of buckets) {
      if (!hasValue(bucket)) continue;

      await prisma.campaignStat.upsert({
        where: { campaignId_date: { campaignId, date: day } },
        update: {
          impressions: { increment: bucket.impressions },
          opens: { increment: bucket.opens },
          clicks: { increment: bucket.clicks },
          addToCarts: { increment: bucket.addToCarts },
          dismisses: { increment: bucket.dismisses },
          revenue: { increment: bucket.revenue },
        },
        create: { id: randomUUID(), campaignId, date: day, ...bucket },
      });
    }

    return events.length;
  }

  static async stats(campaignIds: string[], days: number): Promise<Record<string, CampaignStat[]>> {
    if (!campaignIds.length) return {};
    const since = startOfUtcDay(new Date(Date.now() - (days - 1) * 86400000));
    const rows = await prisma.campaignStat.findMany({
      where: { campaignId: { in: campaignIds }, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    const result: Record<string, CampaignStat[]> = {};
    for (const id of campaignIds) result[id] = [];
    for (const row of rows) {
      result[row.campaignId]?.push({
        campaignId: row.campaignId,
        date: new Date(row.date).toISOString(),
        impressions: row.impressions,
        opens: row.opens,
        clicks: row.clicks,
        addToCarts: row.addToCarts,
        dismisses: row.dismisses,
        revenue: row.revenue,
      });
    }
    return result;
  }

  static async pruneOldEvents(): Promise<void> {
    const cutoff = new Date(Date.now() - RAW_EVENT_RETENTION_DAYS * 86400000);
    await prisma.campaignEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  }

  static async deleteForApp(authorizedAppId: string): Promise<void> {
    await prisma.campaignEvent.deleteMany({ where: { authorizedAppId } });
  }
}
