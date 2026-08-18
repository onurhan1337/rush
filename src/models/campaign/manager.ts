import { prisma } from '@/lib/prisma';
import { DEFAULT_APPEARANCE, type Appearance } from '@/lib/campaigns/appearance';
import { ruleSchema } from '@/lib/campaigns/rules/schema';
import { EMPTY_RULE_SET, type Rule, type RuleSet } from '@/lib/campaigns/rules/types';
import type { Campaign, CampaignInput, CampaignStatus } from './index';

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function readRules(raw: string | null | undefined): RuleSet {
  const stored = parseJson<Partial<RuleSet>>(raw, EMPTY_RULE_SET);
  const conditions = Array.isArray(stored.conditions) ? stored.conditions : [];

  return {
    match: stored.match === 'any' ? 'any' : 'all',
    conditions: conditions.flatMap((condition) => {
      const parsed = ruleSchema.safeParse(condition);
      return parsed.success ? [parsed.data as Rule] : [];
    }),
  };
}

function readIkasCampaignIds(db: any): string[] {
  const parsed = parseJson<string[]>(db.ikasCampaignIds, []);
  if (Array.isArray(parsed) && parsed.length) return parsed;
  return db.ikasCampaignId ? [db.ikasCampaignId] : [];
}

export class CampaignManager {
  private static toModel(db: any): Campaign {
    return {
      id: db.id,
      merchantId: db.merchantId,
      authorizedAppId: db.authorizedAppId,
      type: db.type,
      name: db.name,
      status: db.status as CampaignStatus,
      startsAt: db.startsAt ? new Date(db.startsAt).toISOString() : undefined,
      endsAt: db.endsAt ? new Date(db.endsAt).toISOString() : undefined,
      config: parseJson<Record<string, unknown>>(db.config, {}),
      rules: readRules(db.rules),
      appearance: { ...DEFAULT_APPEARANCE, ...parseJson<Partial<Appearance>>(db.appearance, {}) },
      ikasCampaignIds: readIkasCampaignIds(db),
      publishedSnapshot: db.publishedSnapshot ?? undefined,
      publishedVersion: db.publishedVersion ?? undefined,
      publishedAt: db.publishedAt ? new Date(db.publishedAt).toISOString() : undefined,
      priority: db.priority ?? 0,
      createdAt: new Date(db.createdAt).toISOString(),
      updatedAt: new Date(db.updatedAt).toISOString(),
      deleted: db.deleted ?? false,
    };
  }

  private static toRow(campaign: CampaignInput) {
    return {
      merchantId: campaign.merchantId,
      authorizedAppId: campaign.authorizedAppId,
      type: campaign.type,
      name: campaign.name,
      status: campaign.status,
      startsAt: campaign.startsAt ? new Date(campaign.startsAt) : null,
      endsAt: campaign.endsAt ? new Date(campaign.endsAt) : null,
      config: JSON.stringify(campaign.config ?? {}),
      rules: JSON.stringify(campaign.rules ?? EMPTY_RULE_SET),
      appearance: JSON.stringify(campaign.appearance ?? DEFAULT_APPEARANCE),
      ikasCampaignId: campaign.ikasCampaignIds?.[0] ?? null,
      ikasCampaignIds: JSON.stringify(campaign.ikasCampaignIds ?? []),
      publishedSnapshot: campaign.publishedSnapshot ?? null,
      publishedVersion: campaign.publishedVersion ?? null,
      publishedAt: campaign.publishedAt ? new Date(campaign.publishedAt) : null,
      priority: campaign.priority ?? 0,
      deleted: campaign.deleted ?? false,
    };
  }

  static async get(authorizedAppId: string, id: string): Promise<Campaign | undefined> {
    const row = await prisma.campaign.findUnique({ where: { id } });
    if (!row || row.deleted || row.authorizedAppId !== authorizedAppId) return undefined;
    return this.toModel(row);
  }

  static async put(campaign: CampaignInput): Promise<Campaign> {
    const row = this.toRow(campaign);
    const upserted = await prisma.campaign.upsert({
      where: { id: campaign.id },
      update: row,
      create: { id: campaign.id, ...row },
    });
    return this.toModel(upserted);
  }

  static async list(authorizedAppId: string, status?: CampaignStatus): Promise<Campaign[]> {
    const rows = await prisma.campaign.findMany({
      where: { authorizedAppId, deleted: false, ...(status ? { status } : {}) },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => CampaignManager.toModel(row));
  }

  static async listActive(authorizedAppId: string): Promise<Campaign[]> {
    const now = new Date();
    const rows = await prisma.campaign.findMany({
      where: {
        authorizedAppId,
        deleted: false,
        status: 'ACTIVE',
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => CampaignManager.toModel(row));
  }

  static async setStatus(authorizedAppId: string, id: string, status: CampaignStatus): Promise<Campaign | undefined> {
    const existing = await this.get(authorizedAppId, id);
    if (!existing) return undefined;
    const updated = await prisma.campaign.update({ where: { id }, data: { status } });
    return this.toModel(updated);
  }

  static async delete(authorizedAppId: string, id: string): Promise<boolean> {
    const existing = await this.get(authorizedAppId, id);
    if (!existing) return false;
    await prisma.campaign.update({ where: { id }, data: { deleted: true } });
    return true;
  }

  static async endAll(authorizedAppId: string): Promise<Campaign[]> {
    const campaigns = await this.list(authorizedAppId);
    if (campaigns.length) {
      await prisma.campaign.updateMany({ where: { authorizedAppId, deleted: false }, data: { status: 'ENDED' } });
    }
    return campaigns;
  }
}
