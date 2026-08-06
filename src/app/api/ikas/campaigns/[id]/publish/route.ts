import { NextResponse } from 'next/server';
import { apiError, ensureSettings, withMerchantParams } from '@/lib/api-route-helpers';
import { getCampaignType } from '@/lib/campaigns/registry';
import { deleteIkasCampaign, upsertIkasCampaign } from '@/lib/campaigns/ikas-campaign-sync';
import { getProduct } from '@/lib/ikas-products';
import { getPublicBaseUrl } from '@/lib/public-url';
import { installScript, listStorefronts } from '@/lib/storefront-script';
import { CampaignManager } from '@/models/campaign/manager';
import { StorefrontScriptManager } from '@/models/storefront-script/manager';
import type { Campaign } from '@/models/campaign';

type Params = { id: string };

export type PublishCampaignApiResponse = { campaign: Campaign };

export const POST = withMerchantParams<Params>(async (request, context, params) => {
  const campaign = await CampaignManager.get(context.authorizedAppId, params.id);
  if (!campaign) return apiError(404, 'Kampanya bulunamadı');

  const body = await request.json().catch(() => ({}));
  const action: 'publish' | 'pause' = body?.action === 'pause' ? 'pause' : 'publish';

  if (action === 'pause') {
    await deleteIkasCampaign(context.ikas, campaign.ikasCampaignId);
    const paused = await CampaignManager.put({ ...campaign, status: 'PAUSED', ikasCampaignId: undefined });
    return NextResponse.json({ data: { campaign: paused } });
  }

  const definition = getCampaignType(campaign.type);
  if (!definition) return apiError(400, `Bilinmeyen kampanya tipi: ${campaign.type}`);

  const parsedConfig = definition.configSchema.safeParse(campaign.config);
  if (!parsedConfig.success) {
    return apiError(400, parsedConfig.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '));
  }

  const productId = (parsedConfig.data as { productId: string }).productId;
  const product = await getProduct(context.ikas, productId);
  if (!product) return apiError(400, 'Kampanyadaki ürün ikas tarafında bulunamadı');

  const storefronts = await listStorefronts(context.ikas);
  const salesChannelIds = Array.from(new Set(storefronts.map((storefront) => storefront.salesChannelId)));

  const sync = await upsertIkasCampaign(context.ikas, campaign, product, salesChannelIds);
  if (!sync.ok) return apiError(400, sync.error);

  const settings = await ensureSettings(context);
  const installed = await StorefrontScriptManager.list(context.authorizedAppId);
  if (installed.length < storefronts.length) {
    await installScript(context.ikas, context.authorizedAppId, settings.publicKey, getPublicBaseUrl(request));
  }

  const published = await CampaignManager.put({
    ...campaign,
    status: 'ACTIVE',
    ikasCampaignId: sync.ikasCampaignId,
  });

  return NextResponse.json({ data: { campaign: published } });
});
