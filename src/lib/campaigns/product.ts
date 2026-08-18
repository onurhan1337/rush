import { buildMedia, type IkasMedia } from '@/lib/ikas-image';
import type { Currency } from '@/lib/money';
import type { ApplicablePrice } from './ikas-settings';
import { resolveVariantTypes, type ResolvedVariantType, type VariantOption, type VariantTypeCatalog } from './variant-types';
import type { SearchProductQueryData } from '@/lib/ikas-client/generated/graphql';

type RawProduct = SearchProductQueryData['data'][number];
type RawVariant = RawProduct['variants'][number];

export type ResolvedVariant = {
  id: string;
  label: string;
  options: VariantOption[];
  media?: IkasMedia;
  sellPrice: number;
  discountPrice?: number;
  stockCount: number;
  inStock: boolean;
  isActive: boolean;
  sku?: string;
  currencyCode?: string;
  currencySymbol?: string;
};

export type ResolvedProduct = {
  id: string;
  name: string;
  slug?: string;
  hasOptions: boolean;
  currencyCode?: string;
  currencySymbol?: string;
  variantTypes: ResolvedVariantType[];
  variants: ResolvedVariant[];
};

function pickPrice(variant: RawVariant) {
  const prices = variant.prices ?? [];
  return prices.find((price) => !price.priceListId) ?? prices[0];
}

function variantOptions(variant: RawVariant): VariantOption[] {
  return (variant.variantValues ?? []).map((value) => ({
    typeId: value.variantTypeId,
    typeName: value.variantTypeName,
    valueId: value.variantValueId,
    valueName: value.variantValueName,
  }));
}

function variantLabel(options: VariantOption[], variant: RawVariant, fallback: string): string {
  if (options.length) return options.map((option) => option.valueName).join(' / ');
  return variant.sku || fallback;
}

function variantMedia(variant: RawVariant, merchantId: string): IkasMedia | undefined {
  const media = variant.images ?? [];
  const images = media.filter((item) => !item.isVideo);
  const preferred = images.find((image) => image.isMain) ?? images[0] ?? media[0];
  return buildMedia(preferred, merchantId);
}

function stockCount(variant: RawVariant): number {
  return (variant.stocks ?? []).reduce((total, stock) => total + (stock.stockCount ?? 0), 0);
}

export function resolveProduct(
  raw: RawProduct,
  merchantId: string,
  catalog: VariantTypeCatalog,
  fallbackCurrency: Currency = {},
): ResolvedProduct {
  const variants: ResolvedVariant[] = (raw.variants ?? []).map((variant) => {
    const price = pickPrice(variant);
    const count = stockCount(variant);
    const options = variantOptions(variant);
    return {
      id: variant.id,
      label: variantLabel(options, variant, raw.name),
      options,
      media: variantMedia(variant, merchantId),
      sellPrice: price?.sellPrice ?? 0,
      discountPrice: price?.discountPrice ?? undefined,
      stockCount: count,
      inStock: count > 0 || !!variant.sellIfOutOfStock,
      isActive: variant.isActive,
      sku: variant.sku ?? undefined,
      currencyCode: price?.currencyCode ?? undefined,
      currencySymbol: price?.currencySymbol ?? undefined,
    };
  });

  const firstPriced = variants.find((variant) => variant.currencySymbol);
  const fallbackMedia = variants.find((variant) => variant.media)?.media;

  for (const variant of variants) {
    if (!variant.media) variant.media = fallbackMedia;
  }

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.metaData?.slug ?? undefined,
    hasOptions: !!raw.productOptionSetId,
    currencyCode: firstPriced?.currencyCode ?? fallbackCurrency.code,
    currencySymbol: firstPriced?.currencySymbol ?? fallbackCurrency.symbol,
    variantTypes: resolveVariantTypes(variants, catalog),
    variants,
  };
}

export function effectivePrice(variant: ResolvedVariant): number {
  return typeof variant.discountPrice === 'number' && variant.discountPrice > 0 ? variant.discountPrice : variant.sellPrice;
}

export function priceBasis(variant: ResolvedVariant, applicablePrice: ApplicablePrice): number {
  return applicablePrice === 'DISCOUNT_PRICE' ? effectivePrice(variant) : variant.sellPrice;
}
