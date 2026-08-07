import { z } from 'zod';

export const countdownSchema = z
  .object({
    mode: z.enum(['fixed', 'perSession']).default('fixed'),
    endsAt: z.string().optional(),
    durationSec: z.number().int().min(30).max(30 * 86400).optional(),
  })
  .refine((value) => (value.mode === 'fixed' ? !!value.endsAt : !!value.durationSec), {
    message: 'Sabit modda bitiş tarihi, oturum modunda süre zorunludur',
  });

export const offerProductItemSchema = z.object({
  productId: z.string().min(1, 'Ürün seçin'),
  variantIds: z.array(z.string().min(1)).min(1, 'En az bir varyant seçin'),
  offerPrice: z.number().min(0, 'Fırsat fiyatı 0 veya üzeri olmalı'),
  quantity: z.number().int().min(1).max(50).default(1),
});

export const VARIANT_STYLES = ['chip', 'swatch', 'image', 'list'] as const;
export const VARIANT_SELECTIONS = ['single', 'multi'] as const;

export type VariantStyle = (typeof VARIANT_STYLES)[number];
export type VariantSelection = (typeof VARIANT_SELECTIONS)[number];

const offerProductShape = z.object({
  items: z.array(offerProductItemSchema).min(1, 'En az bir ürün seçin'),
  countdown: countdownSchema,
  headline: z.string().min(1, 'Başlık zorunlu').max(80),
  subtitle: z.string().max(120).default(''),
  ctaLabel: z.string().min(1).max(30).default('Sepete ekle'),
  tabLabel: z.string().min(1).max(24).default('Fırsat ürün'),
  variantStyle: z.enum(VARIANT_STYLES).default('chip'),
  variantSelection: z.enum(VARIANT_SELECTIONS).default('single'),
});

// Configs saved before multi-product support keep a single productId/variantIds pair at the
// root — lift them into items so existing campaigns keep opening and publishing.
function migrateLegacyConfig(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;

  const config = value as Record<string, unknown>;
  if (config.items !== undefined || config.productId === undefined) return value;

  const { productId, variantIds, offerPrice, quantity, ...rest } = config;
  return {
    ...rest,
    items: [{ productId, variantIds: variantIds ?? [], offerPrice: offerPrice ?? 0, quantity: quantity ?? 1 }],
  };
}

export const offerProductConfigSchema = z.preprocess(migrateLegacyConfig, offerProductShape);

export type OfferProductItem = z.infer<typeof offerProductItemSchema>;
export type OfferProductConfig = z.infer<typeof offerProductShape>;

export const OFFER_PRODUCT_DEFAULT_CONFIG: OfferProductConfig = {
  items: [],
  countdown: { mode: 'perSession', durationSec: 3600 },
  headline: 'Fırsat Ürün! 🎁',
  subtitle: 'Sınırlı süre için özel fiyat.',
  ctaLabel: 'Sepete ekle',
  tabLabel: 'Fırsat ürün',
  variantStyle: 'chip',
  variantSelection: 'single',
};
