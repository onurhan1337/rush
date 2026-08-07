import { z } from 'zod';
import { DEFAULT_IKAS_SETTINGS, ikasSettingsSchema } from '@/lib/campaigns/ikas-settings';

export const AFTER_ADD_TO_CART = ['drawer', 'cart', 'stay'] as const;

export type AfterAddToCart = (typeof AFTER_ADD_TO_CART)[number];

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

const offerProductShape = z.object({
  items: z.array(offerProductItemSchema).min(1, 'En az bir ürün seçin'),
  countdown: countdownSchema,
  headline: z.string().min(1, 'Başlık zorunlu').max(80),
  subtitle: z.string().max(120).default(''),
  ctaLabel: z.string().min(1).max(30).default('Sepete ekle'),
  tabLabel: z.string().min(1).max(24).default('Fırsat ürün'),
  currencySymbol: z.string().max(6).default(''),
  afterAddToCart: z.enum(AFTER_ADD_TO_CART).default('drawer'),
  cartTriggerSelector: z.string().max(200).default(''),
  ikas: ikasSettingsSchema.default(DEFAULT_IKAS_SETTINGS),
});

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
  currencySymbol: '',
  afterAddToCart: 'drawer',
  cartTriggerSelector: '',
  ikas: DEFAULT_IKAS_SETTINGS,
};
