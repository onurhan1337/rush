import { NextResponse } from 'next/server';
import { apiError, withMerchantParams } from '@/lib/api-route-helpers';
import { campaignPatchSchema, parseCampaignConfig } from '@/lib/campaigns/api-schema';
import { deleteIkasCampaigns } from '@/lib/campaigns/ikas-campaign-sync';
import { CampaignManager } from '@/models/campaign/manager';
import type { Campaign } from '@/models/campaign';

type Params = { id: string };

export type GetCampaignApiResponse = { campaign: Campaign };

export const GET = withMerchantParams<Params>(async (_request, context, params) => {
  const campaign = await CampaignManager.get(context.authorizedAppId, params.id);
  if (!campaign) return apiError(404, 'Kampanya bulunamadı');
  return NextResponse.json({ data: { campaign } });
});

export const PATCH = withMerchantParams<Params>(async (request, context, params) => {
  const existing = await CampaignManager.get(context.authorizedAppId, params.id);
  if (!existing) return apiError(404, 'Kampanya bulunamadı');

  const body = await request.json().catch(() => null);
  const parsed = campaignPatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, parsed.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '));
  }

  const patch = parsed.data;
  const nextType = patch.type ?? existing.type;

  // Drafts are allowed to be incomplete — an editor that refuses to save until every
  // field is valid loses the merchant's work. Publishing is where config is enforced.
  if (patch.config && (patch.status ?? existing.status) === 'ACTIVE') {
    const configResult = parseCampaignConfig(nextType, patch.config);
    if (!configResult.ok) return apiError(400, configResult.error);
  }

  const campaign = await CampaignManager.put({
    ...existing,
    type: nextType,
    name: patch.name ?? existing.name,
    status: patch.status ?? existing.status,
    startsAt: 'startsAt' in patch ? patch.startsAt : existing.startsAt,
    endsAt: 'endsAt' in patch ? patch.endsAt : existing.endsAt,
    config: patch.config ?? existing.config,
    rules: patch.rules ?? existing.rules,
    appearance: patch.appearance ? { ...existing.appearance, ...patch.appearance } : existing.appearance,
    priority: patch.priority ?? existing.priority,
  });

  return NextResponse.json({ data: { campaign } });
});

export const DELETE = withMerchantParams<Params>(async (_request, context, params) => {
  const campaign = await CampaignManager.get(context.authorizedAppId, params.id);
  if (!campaign) return apiError(404, 'Kampanya bulunamadı');

  await deleteIkasCampaigns(context.ikas, campaign.ikasCampaignIds);
  await CampaignManager.delete(context.authorizedAppId, params.id);

  return NextResponse.json({ data: { deleted: true } });
});
