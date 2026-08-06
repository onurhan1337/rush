import { buildImageUrl } from '@/lib/ikas-image';
import type { SearchProductQueryData } from '@/lib/ikas-client/generated/graphql';

type RawProduct = SearchProductQueryData['data'][number];
type RawVariant = RawProduct['variants'][number];

export type ResolvedVariant = {
  id: string;
  label: string;
  imageUrl?: string;
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
  variants: ResolvedVariant[];
};

function pickPrice(variant: RawVariant) {
  const prices = variant.prices ?? [];
  return prices.find((price) => !price.priceListId) ?? prices[0];
}

function variantLabel(variant: RawVariant, fallback: string): string {
  const values = variant.variantValues ?? [];
  if (values.length) return values.map((value) => value.variantValueName).join(' / ');
  return variant.sku || fallback;
}

function variantImage(variant: RawVariant): string | undefined {
  const images = (variant.images ?? []).filter((image) => !image.isVideo);
  const main = images.find((image) => image.isMain) ?? images[0];
  return buildImageUrl(main?.imageId, 'sm');
}

function stockCount(variant: RawVariant): number {
  return (variant.stocks ?? []).reduce((total, stock) => total + (stock.stockCount ?? 0), 0);
}

export function resolveProduct(raw: RawProduct): ResolvedProduct {
  const variants: ResolvedVariant[] = (raw.variants ?? []).map((variant) => {
    const price = pickPrice(variant);
    const count = stockCount(variant);
    return {
      id: variant.id,
      label: variantLabel(variant, raw.name),
      imageUrl: variantImage(variant),
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

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.metaData?.slug ?? undefined,
    hasOptions: !!raw.productOptionSetId,
    currencyCode: firstPriced?.currencyCode,
    currencySymbol: firstPriced?.currencySymbol,
    variants,
  };
}

export function effectivePrice(variant: ResolvedVariant): number {
  return typeof variant.discountPrice === 'number' && variant.discountPrice > 0 ? variant.discountPrice : variant.sellPrice;
}
