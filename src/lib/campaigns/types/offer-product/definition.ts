import type { CampaignTypeDefinition } from '@/lib/campaigns/definition';
import type { OfferProductWidgetData, WidgetProduct, WidgetVariant } from '@/lib/campaigns/widget-types';
import { effectivePrice, type ResolvedProduct } from '@/lib/campaigns/product';
import { narrowVariantTypes } from '@/lib/campaigns/variant-types';
import { mapOfferProductToIkasCampaign } from './ikas-campaign';
import { OFFER_PRODUCT_DEFAULT_CONFIG, offerProductConfigSchema, type OfferProductConfig, type OfferProductItem } from './schema';

function productUrl(slug: string | undefined, id: string): string {
  return slug ? `/${slug}` : `/product/${id}`;
}

function toWidgetProduct(item: OfferProductItem, product: ResolvedProduct, config: OfferProductConfig): WidgetProduct | null {
  const offered = product.variants.filter((variant) => item.variantIds.includes(variant.id) && variant.isActive);
  if (!offered.length) return null;

  const variants: WidgetVariant[] = offered.map((variant) => ({
    id: variant.id,
    label: variant.label,
    options: variant.options,
    media: variant.media,
    sellPrice: effectivePrice(variant),
    offerPrice: item.offerPrice,
    inStock: variant.inStock,
  }));

  return {
    id: product.id,
    name: product.name,
    url: productUrl(product.slug, product.id),
    hasOptions: product.hasOptions,
    quantity: item.quantity,
    currency: {
      code: product.currencyCode,
      symbol: config.currencySymbol || (product.currencyCode ? undefined : product.currencySymbol),
    },
    variantTypes: narrowVariantTypes(product.variantTypes, offered),
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
        return product ? toWidgetProduct(item, product, config) : null;
      })
      .filter((product): product is WidgetProduct => !!product);

    if (!widgetProducts.length) return null;

    const data: OfferProductWidgetData = {
      headline: config.headline,
      subtitle: config.subtitle,
      ctaLabel: config.ctaLabel,
      tabLabel: config.tabLabel,
      afterAddToCart: config.afterAddToCart,
      cartTriggerSelector: config.cartTriggerSelector,
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
