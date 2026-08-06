import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { apiError, ensureSettings, withMerchant } from '@/lib/api-route-helpers';
import { campaignWriteSchema } from '@/lib/campaigns/api-schema';
import { DEFAULT_APPEARANCE } from '@/lib/campaigns/appearance';
import { getCampaignType } from '@/lib/campaigns/registry';
import { CampaignManager } from '@/models/campaign/manager';
import type { Campaign } from '@/models/campaign';

export type ListCampaignsApiResponse = { campaigns: Campaign[] };
export type CreateCampaignApiResponse = { campaign: Campaign };

export const GET = withMerchant(async (_request, context) => {
  const campaigns = await CampaignManager.list(context.authorizedAppId);
  return NextResponse.json({ data: { campaigns } });
});

export const POST = withMerchant(async (request, context) => {
  const body = await request.json().catch(() => null);
  const parsed = campaignWriteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, parsed.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '));
  }

  const definition = getCampaignType(parsed.data.type);
  if (!definition) return apiError(400, `Bilinmeyen kampanya tipi: ${parsed.data.type}`);

  await ensureSettings(context);

  const campaign = await CampaignManager.put({
    id: randomUUID(),
    merchantId: context.merchantId,
    authorizedAppId: context.authorizedAppId,
    type: parsed.data.type,
    name: parsed.data.name,
    status: 'DRAFT',
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
    config: (Object.keys(parsed.data.config).length ? parsed.data.config : definition.defaultConfig) as Record<string, unknown>,
    rules: parsed.data.rules,
    appearance: { ...DEFAULT_APPEARANCE, ...parsed.data.appearance },
    priority: parsed.data.priority,
  });

  return NextResponse.json({ data: { campaign } }, { status: 201 });
});
