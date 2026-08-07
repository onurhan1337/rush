import type { CampaignTypeDefinition } from '@/lib/campaigns/definition';
import type { OfferProductWidgetData, WidgetProduct, WidgetVariant } from '@/lib/campaigns/widget-types';
import { effectivePrice, type ResolvedProduct } from '@/lib/campaigns/product';
import { mapOfferProductToIkasCampaign } from './ikas-campaign';
import { OFFER_PRODUCT_DEFAULT_CONFIG, offerProductConfigSchema, type OfferProductConfig, type OfferProductItem } from './schema';

function productUrl(slug: string | undefined, id: string): string {
  return slug ? `/${slug}` : `/product/${id}`;
}

function toWidgetProduct(item: OfferProductItem, product: ResolvedProduct): WidgetProduct | null {
  const variants: WidgetVariant[] = product.variants
    .filter((variant) => item.variantIds.includes(variant.id) && variant.isActive)
    .map((variant) => ({
      id: variant.id,
      label: variant.label,
      media: variant.media,
      swatchColor: variant.swatchColor,
      sellPrice: effectivePrice(variant),
      offerPrice: item.offerPrice,
      inStock: variant.inStock,
    }));

  if (!variants.length) return null;

  return {
    id: product.id,
    name: product.name,
    url: productUrl(product.slug, product.id),
    hasOptions: product.hasOptions,
    quantity: item.quantity,
    currencySymbol: product.currencySymbol ?? '',
    variants,
  };
}

export const offerProductDefinition: CampaignTypeDefinition<OfferProductConfig> = {
  key: 'offer-product',
  label: 'Fırsat Ürün',
  description: 'Mağaza kenarında açılır bir sekmede geri sayımlı özel fiyatlı ürünler gösterir.',
  configSchema: offerProductConfigSchema,
  defaultConfig: OFFER_PRODUCT_DEFAULT_CONFIG,
  supportedRules: ['cart_total', 'cart_contains_product', 'page_type', 'visitor', 'schedule'],

  toIkasCampaignInput: (campaign, config, context) => mapOfferProductToIkasCampaign(campaign, config, context),

  toWidgetPayload: (campaign, config, products) => {
    const byId = new Map(products.map((product) => [product.id, product]));

    const widgetProducts = config.items
      .map((item) => {
        const product = byId.get(item.productId);
        return product ? toWidgetProduct(item, product) : null;
      })
      .filter((product): product is WidgetProduct => !!product);

    if (!widgetProducts.length) return null;

    const data: OfferProductWidgetData = {
      headline: config.headline,
      subtitle: config.subtitle,
      ctaLabel: config.ctaLabel,
      tabLabel: config.tabLabel,
      variantStyle: config.variantStyle,
      variantSelection: config.variantSelection,
      countdown: {
        mode: config.countdown.mode,
        endsAt: config.countdown.endsAt ? Date.parse(config.countdown.endsAt) : undefined,
        durationSec: config.countdown.durationSec,
      },
      products: widgetProducts,
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
