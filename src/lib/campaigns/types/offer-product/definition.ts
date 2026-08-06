import type { CampaignTypeDefinition } from '@/lib/campaigns/definition';
import type { OfferProductWidgetData, WidgetVariant } from '@/lib/campaigns/widget-types';
import { effectivePrice } from '@/lib/campaigns/product';
import { mapOfferProductToIkasCampaign } from './ikas-campaign';
import { OFFER_PRODUCT_DEFAULT_CONFIG, offerProductConfigSchema, type OfferProductConfig } from './schema';

function productUrl(slug: string | undefined, id: string): string {
  return slug ? `/${slug}` : `/product/${id}`;
}

export const offerProductDefinition: CampaignTypeDefinition<OfferProductConfig> = {
  key: 'offer-product',
  label: 'Fırsat Ürün',
  description: 'Mağaza kenarında açılır bir sekmede geri sayımlı özel fiyatlı ürün gösterir.',
  configSchema: offerProductConfigSchema,
  defaultConfig: OFFER_PRODUCT_DEFAULT_CONFIG,
  supportedRules: ['cart_total', 'cart_contains_product', 'page_type', 'visitor', 'schedule'],

  toIkasCampaignInput: (campaign, config, context) => mapOfferProductToIkasCampaign(campaign, config, context),

  toWidgetPayload: (campaign, config, product) => {
    const variants: WidgetVariant[] = product.variants
      .filter((variant) => config.variantIds.includes(variant.id) && variant.isActive)
      .map((variant) => ({
        id: variant.id,
        label: variant.label,
        imageUrl: variant.imageUrl,
        sellPrice: effectivePrice(variant),
        offerPrice: config.offerPrice,
        inStock: variant.inStock,
      }));

    if (!variants.length) return null;

    const data: OfferProductWidgetData = {
      headline: config.headline,
      subtitle: config.subtitle,
      ctaLabel: config.ctaLabel,
      tabLabel: config.tabLabel,
      productName: product.name,
      productUrl: productUrl(product.slug, product.id),
      hasOptions: product.hasOptions,
      quantity: config.quantity,
      currencySymbol: product.currencySymbol ?? '',
      countdown: {
        mode: config.countdown.mode,
        endsAt: config.countdown.endsAt ? Date.parse(config.countdown.endsAt) : undefined,
        durationSec: config.countdown.durationSec,
      },
      variants,
    };

    return {
      id: campaign.id,
      type: campaign.type,
      rules: campaign.rules,
      appearance: campaign.appearance,
      data,
    };
  },
};
