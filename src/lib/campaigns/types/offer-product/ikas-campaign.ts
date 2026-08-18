import {
  CampaignApplicablePriceEnum,
  CampaignFilterTypeEnum,
  CampaignGetYDiscountTypeEnum,
  CampaignTypeEnum,
  type CreateCampaignInput,
} from '@/lib/ikas-client/generated/graphql';
import type { Campaign } from '@/models/campaign';
import { priceBasis, type ResolvedProduct, type ResolvedVariant } from '@/lib/campaigns/product';
import type { CartContainsProductRule, CartTotalRule } from '@/lib/campaigns/rules/types';
import type { IkasSettings } from '@/lib/campaigns/ikas-settings';
import type { OfferProductConfig, OfferProductItem } from './schema';

export type IkasCampaignMapping = { ok: true; inputs: CreateCampaignInput[] } | { ok: false; error: string };

export type MappingContext = {
  products: ResolvedProduct[];
  salesChannelIds: string[];
};

function dateRange(campaign: Campaign): CreateCampaignInput['dateRange'] {
  const start = campaign.startsAt ? Date.parse(campaign.startsAt) : undefined;
  const end = campaign.endsAt ? Date.parse(campaign.endsAt) : undefined;
  if (!start && !end) return undefined;
  return { start, end };
}

function itemInput(
  campaign: Campaign,
  item: OfferProductItem,
  variants: ResolvedVariant[],
  title: string,
  settings: IkasSettings,
  salesChannelIds: string[],
): { ok: true; input: CreateCampaignInput } | { ok: false; error: string } {
  const cartContains = campaign.rules.conditions.find((rule): rule is CartContainsProductRule => rule.kind === 'cart_contains_product');
  const cartTotal = campaign.rules.conditions.find((rule): rule is CartTotalRule => rule.kind === 'cart_total' && rule.op === 'gte');

  const base = {
    title,
    applicablePrice:
      settings.applicablePrice === 'DISCOUNT_PRICE' ? CampaignApplicablePriceEnum.DISCOUNT_PRICE : CampaignApplicablePriceEnum.SELL_PRICE,
    canCombineWithOtherCampaigns: settings.canCombineWithOtherCampaigns,
    includeDiscountedProducts: settings.includeDiscountedProducts,
    isFreeShipping: settings.isFreeShipping,
    usageLimit: settings.usageLimit,
    usageLimitPerCustomer: settings.usageLimitPerCustomer,
    hasCoupon: false,
    applyCampaignToProductPrice: true,
    salesChannelIds: salesChannelIds.length ? salesChannelIds : undefined,
    dateRange: dateRange(campaign),
  };

  const basePrices = Array.from(new Set(variants.map((variant) => priceBasis(variant, settings.applicablePrice))));
  const cheapestBase = Math.min(...basePrices);
  if (item.offerPrice >= cheapestBase) {
    return { ok: false, error: `${title}: fırsat fiyatı satış fiyatından düşük olmalı` };
  }

  if (cartContains && (cartContains.products.length || cartContains.variantIds.length)) {
    const usesVariants = cartContains.variantIds.length > 0;
    return {
      ok: true,
      input: {
        ...base,
        type: CampaignTypeEnum.BUY_X_THEN_GET_Y,
        buyXThenGetY: {
          buyX: {
            amount: 1,
            applyByQuantity: true,
            filter: {
              type: usesVariants ? CampaignFilterTypeEnum.VARIANT : CampaignFilterTypeEnum.PRODUCT,
              idList: usesVariants ? cartContains.variantIds : cartContains.products.map((product) => product.id),
            },
          },
          getY: {
            amount: item.quantity,
            discountRatio: item.offerPrice,
            discountType: CampaignGetYDiscountTypeEnum.FIXED_PRODUCT_PRICE,
            filter: { type: CampaignFilterTypeEnum.VARIANT, idList: item.variantIds },
          },
          maxUsagePerOrder: 1,
        },
      },
    };
  }

  if (basePrices.length > 1) {
    return {
      ok: false,
      error: `${title}: seçili varyantların satış fiyatları farklı. Tek bir sabit indirim tutarı uygulanamaz — aynı fiyatlı varyantları seçin veya sepet ürünü kuralı ekleyin.`,
    };
  }

  const sellPrice = basePrices[0];

  return {
    ok: true,
    input: {
      ...base,
      type: CampaignTypeEnum.FIXED_AMOUNT,
      fixedDiscount: {
        amount: Number((sellPrice - item.offerPrice).toFixed(2)),
        isApplyByCartAmount: false,
        shouldMatchAllConditions: true,
        filters: [{ type: CampaignFilterTypeEnum.VARIANT, idList: item.variantIds }],
        lineItemQuantityRange: { max: item.quantity },
        priceRange: cartTotal ? { min: cartTotal.amount } : undefined,
      },
    },
  };
}

export function mapOfferProductToIkasCampaign(campaign: Campaign, config: OfferProductConfig, context: MappingContext): IkasCampaignMapping {
  const byId = new Map(context.products.map((product) => [product.id, product]));
  const inputs: CreateCampaignInput[] = [];

  for (const item of config.items) {
    const product = byId.get(item.productId);
    if (!product) return { ok: false, error: 'Kampanyadaki ürün ikas tarafında bulunamadı' };

    const variants = product.variants.filter((variant) => item.variantIds.includes(variant.id));
    if (!variants.length) return { ok: false, error: `${product.name}: seçili varyant bulunamadı` };

    const title = config.items.length > 1 ? `Rush — ${campaign.name} — ${product.name}` : `Rush — ${campaign.name}`;
    const mapped = itemInput(campaign, item, variants, title, config.ikas, context.salesChannelIds);
    if (!mapped.ok) return mapped;

    inputs.push(mapped.input);
  }

  if (!inputs.length) return { ok: false, error: 'Kampanyada ürün yok' };
  return { ok: true, inputs };
}
