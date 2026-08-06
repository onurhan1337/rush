import {
  CampaignApplicablePriceEnum,
  CampaignFilterTypeEnum,
  CampaignGetYDiscountTypeEnum,
  CampaignTypeEnum,
  type CreateCampaignInput,
} from '@/lib/ikas-client/generated/graphql';
import type { Campaign } from '@/models/campaign';
import type { ResolvedProduct, ResolvedVariant } from '@/lib/campaigns/product';
import type { CartContainsProductRule, CartTotalRule } from '@/lib/campaigns/rules/types';
import type { OfferProductConfig } from './schema';

export type IkasCampaignMapping = { ok: true; input: CreateCampaignInput } | { ok: false; error: string };

export type MappingContext = {
  product: ResolvedProduct;
  salesChannelIds: string[];
};

function selectedVariants(product: ResolvedProduct, config: OfferProductConfig): ResolvedVariant[] {
  return product.variants.filter((variant) => config.variantIds.includes(variant.id));
}

function dateRange(campaign: Campaign): CreateCampaignInput['dateRange'] {
  const start = campaign.startsAt ? Date.parse(campaign.startsAt) : undefined;
  const end = campaign.endsAt ? Date.parse(campaign.endsAt) : undefined;
  if (!start && !end) return undefined;
  return { start, end };
}

export function mapOfferProductToIkasCampaign(campaign: Campaign, config: OfferProductConfig, context: MappingContext): IkasCampaignMapping {
  const variants = selectedVariants(context.product, config);
  if (!variants.length) return { ok: false, error: 'Seçili varyant bulunamadı' };

  const cartContains = campaign.rules.conditions.find((rule): rule is CartContainsProductRule => rule.kind === 'cart_contains_product');
  const cartTotal = campaign.rules.conditions.find((rule): rule is CartTotalRule => rule.kind === 'cart_total' && rule.op === 'gte');

  const base = {
    title: `Rush — ${campaign.name}`,
    applicablePrice: CampaignApplicablePriceEnum.SELL_PRICE,
    canCombineWithOtherCampaigns: false,
    hasCoupon: false,
    includeDiscountedProducts: true,
    salesChannelIds: context.salesChannelIds.length ? context.salesChannelIds : undefined,
    dateRange: dateRange(campaign),
  };

  if (cartContains && (cartContains.productIds.length || cartContains.variantIds.length)) {
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
              idList: usesVariants ? cartContains.variantIds : cartContains.productIds,
            },
          },
          getY: {
            amount: config.quantity,
            discountRatio: config.offerPrice,
            discountType: CampaignGetYDiscountTypeEnum.FIXED_PRODUCT_PRICE,
            filter: { type: CampaignFilterTypeEnum.VARIANT, idList: config.variantIds },
          },
          maxUsagePerOrder: 1,
        },
      },
    };
  }

  const sellPrices = Array.from(new Set(variants.map((variant) => variant.sellPrice)));
  if (sellPrices.length > 1) {
    return {
      ok: false,
      error: 'Seçili varyantların satış fiyatları farklı. Tek bir sabit indirim tutarı uygulanamaz — aynı fiyatlı varyantları seçin veya sepet ürünü kuralı ekleyin.',
    };
  }

  const sellPrice = sellPrices[0];
  if (config.offerPrice >= sellPrice) {
    return { ok: false, error: 'Fırsat fiyatı satış fiyatından düşük olmalı' };
  }

  return {
    ok: true,
    input: {
      ...base,
      type: CampaignTypeEnum.FIXED_AMOUNT,
      fixedDiscount: {
        amount: Number((sellPrice - config.offerPrice).toFixed(2)),
        isApplyByCartAmount: false,
        shouldMatchAllConditions: true,
        filters: [{ type: CampaignFilterTypeEnum.VARIANT, idList: config.variantIds }],
        lineItemQuantityRange: { max: config.quantity },
        priceRange: cartTotal ? { min: cartTotal.amount } : undefined,
      },
    },
  };
}
