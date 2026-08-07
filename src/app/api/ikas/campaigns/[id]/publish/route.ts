import { NextResponse } from 'next/server';
import { apiError, ensureSettings, withMerchantParams } from '@/lib/api-route-helpers';
import { getCampaignType } from '@/lib/campaigns/registry';
import { deleteIkasCampaigns, upsertIkasCampaign } from '@/lib/campaigns/ikas-campaign-sync';
import { getProducts } from '@/lib/ikas-products';
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
    await deleteIkasCampaigns(context.ikas, campaign.ikasCampaignIds);
    const paused = await CampaignManager.put({ ...campaign, status: 'PAUSED', ikasCampaignIds: [] });
    return NextResponse.json({ data: { campaign: paused } });
  }

  const definition = getCampaignType(campaign.type);
  if (!definition) return apiError(400, `Bilinmeyen kampanya tipi: ${campaign.type}`);

  const parsedConfig = definition.configSchema.safeParse(campaign.config);
  if (!parsedConfig.success) {
    return apiError(400, parsedConfig.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '));
  }

  const productIds = Array.from(new Set((parsedConfig.data as { items: Array<{ productId: string }> }).items.map((item) => item.productId)));
  const products = await getProducts(context.ikas, context.merchantId, productIds);
  if (products.length !== productIds.length) return apiError(400, 'Kampanyadaki ürünlerin bazıları ikas tarafında bulunamadı');

  const storefronts = await listStorefronts(context.ikas);
  const salesChannelIds = Array.from(new Set(storefronts.map((storefront) => storefront.salesChannelId)));

  const sync = await upsertIkasCampaign(context.ikas, campaign, products, salesChannelIds);
  if (!sync.ok) return apiError(400, sync.error);

  const settings = await ensureSettings(context);
  const installed = await StorefrontScriptManager.list(context.authorizedAppId);
  if (installed.length < storefronts.length) {
    await installScript(context.ikas, context.authorizedAppId, settings.publicKey, getPublicBaseUrl(request));
  }

  const published = await CampaignManager.put({
    ...campaign,
    status: 'ACTIVE',
    ikasCampaignIds: sync.ikasCampaignIds,
  });

  return NextResponse.json({ data: { campaign: published } });
});
