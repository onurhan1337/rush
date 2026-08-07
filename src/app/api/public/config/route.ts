import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { getCampaignType } from '@/lib/campaigns/registry';
import { getProduct } from '@/lib/ikas-products';
import { isValidPublicKeyFormat } from '@/lib/public-key';
import { getPublicBaseUrl } from '@/lib/public-url';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { CampaignManager } from '@/models/campaign/manager';
import { MerchantSettingsManager } from '@/models/merchant-settings/manager';
import type { ResolvedProduct } from '@/lib/campaigns/product';
import type { WidgetCampaign, WidgetConfigPayload } from '@/lib/campaigns/widget-types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60',
};

function payload(body: WidgetConfigPayload, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...CORS_HEADERS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } });
}

export async function GET(request: NextRequest) {
  const eventsUrl = `${getPublicBaseUrl(request)}/api/public/events`;
  const empty: WidgetConfigPayload = { campaigns: [], eventsUrl };

  try {
    const key = new URL(request.url).searchParams.get('key');
    if (!isValidPublicKeyFormat(key)) return payload(empty);

    const settings = await MerchantSettingsManager.getByPublicKey(key);
    if (!settings) return payload(empty);

    const campaigns = await CampaignManager.listActive(settings.authorizedAppId);
    if (!campaigns.length) return payload(empty);

    const authToken = await AuthTokenManager.get(settings.authorizedAppId);
    if (!authToken || authToken.deleted) return payload(empty);

    const ikas = getIkas(authToken);
    const productCache = new Map<string, Awaited<ReturnType<typeof getProduct>>>();
    const widgetCampaigns: WidgetCampaign[] = [];

    for (const campaign of campaigns) {
      const definition = getCampaignType(campaign.type);
      if (!definition) continue;

      const parsedConfig = definition.configSchema.safeParse(campaign.config);
      if (!parsedConfig.success) continue;

      const products: ResolvedProduct[] = [];
      for (const item of (parsedConfig.data as { items: Array<{ productId: string }> }).items) {
        if (!productCache.has(item.productId)) {
          productCache.set(item.productId, await getProduct(ikas, settings.merchantId, item.productId));
        }
        const product = productCache.get(item.productId);
        if (product) products.push(product);
      }
      if (!products.length) continue;

      const widgetCampaign = definition.toWidgetPayload(campaign, parsedConfig.data, products);
      if (widgetCampaign) widgetCampaigns.push(widgetCampaign);
    }

    return payload({ campaigns: widgetCampaigns, eventsUrl });
  } catch (error) {
    console.error('Public config failed:', error);
    return payload(empty);
  }
}
