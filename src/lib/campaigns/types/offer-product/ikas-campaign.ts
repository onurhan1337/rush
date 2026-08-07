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
  salesChannelIds: string[],
): { ok: true; input: CreateCampaignInput } | { ok: false; error: string } {
  const cartContains = campaign.rules.conditions.find((rule): rule is CartContainsProductRule => rule.kind === 'cart_contains_product');
  const cartTotal = campaign.rules.conditions.find((rule): rule is CartTotalRule => rule.kind === 'cart_total' && rule.op === 'gte');

  const base = {
    title,
    applicablePrice: CampaignApplicablePriceEnum.SELL_PRICE,
    canCombineWithOtherCampaigns: false,
    hasCoupon: false,
    includeDiscountedProducts: true,
    salesChannelIds: salesChannelIds.length ? salesChannelIds : undefined,
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

  const sellPrices = Array.from(new Set(variants.map((variant) => variant.sellPrice)));
  if (sellPrices.length > 1) {
    return {
      ok: false,
      error: `${title}: seçili varyantların satış fiyatları farklı. Tek bir sabit indirim tutarı uygulanamaz — aynı fiyatlı varyantları seçin veya sepet ürünü kuralı ekleyin.`,
    };
  }

  const sellPrice = sellPrices[0];
  if (item.offerPrice >= sellPrice) {
    return { ok: false, error: `${title}: fırsat fiyatı satış fiyatından düşük olmalı` };
  }

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

// Every product gets its own ikas campaign: one fixed-amount discount cannot express
// different offer prices across products.
export function mapOfferProductToIkasCampaign(campaign: Campaign, config: OfferProductConfig, context: MappingContext): IkasCampaignMapping {
  const byId = new Map(context.products.map((product) => [product.id, product]));
  const inputs: CreateCampaignInput[] = [];

  for (const item of config.items) {
    const product = byId.get(item.productId);
    if (!product) return { ok: false, error: 'Kampanyadaki ürün ikas tarafında bulunamadı' };

    const variants = product.variants.filter((variant) => item.variantIds.includes(variant.id));
    if (!variants.length) return { ok: false, error: `${product.name}: seçili varyant bulunamadı` };

    const title = config.items.length > 1 ? `Rush — ${campaign.name} — ${product.name}` : `Rush — ${campaign.name}`;
    const mapped = itemInput(campaign, item, variants, title, context.salesChannelIds);
    if (!mapped.ok) return mapped;

    inputs.push(mapped.input);
  }

  if (!inputs.length) return { ok: false, error: 'Kampanyada ürün yok' };
  return { ok: true, inputs };
}
