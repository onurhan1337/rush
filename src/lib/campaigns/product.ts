import { buildMedia, type IkasMedia } from '@/lib/ikas-image';
import { swatchColor } from './swatch';
import type { SearchProductQueryData } from '@/lib/ikas-client/generated/graphql';

type RawProduct = SearchProductQueryData['data'][number];
type RawVariant = RawProduct['variants'][number];

export type ResolvedVariant = {
  id: string;
  label: string;
  media?: IkasMedia;
  swatchColor?: string;
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

function variantMedia(variant: RawVariant, merchantId: string): IkasMedia | undefined {
  const media = variant.images ?? [];
  const images = media.filter((item) => !item.isVideo);
  const preferred = images.find((image) => image.isMain) ?? images[0] ?? media[0];
  return buildMedia(preferred, merchantId);
}

function stockCount(variant: RawVariant): number {
  return (variant.stocks ?? []).reduce((total, stock) => total + (stock.stockCount ?? 0), 0);
}

export function resolveProduct(raw: RawProduct, merchantId: string): ResolvedProduct {
  const variants: ResolvedVariant[] = (raw.variants ?? []).map((variant) => {
    const price = pickPrice(variant);
    const count = stockCount(variant);
    const label = variantLabel(variant, raw.name);
    return {
      id: variant.id,
      label,
      media: variantMedia(variant, merchantId),
      swatchColor: swatchColor(label),
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
    currencyCode: firstPriced?.currencyCode,
    currencySymbol: firstPriced?.currencySymbol,
    variants,
  };
}

export function effectivePrice(variant: ResolvedVariant): number {
  return typeof variant.discountPrice === 'number' && variant.discountPrice > 0 ? variant.discountPrice : variant.sellPrice;
}
