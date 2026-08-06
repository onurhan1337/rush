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

export const offerProductConfigSchema = z.object({
  productId: z.string().min(1, 'Ürün seçin'),
  variantIds: z.array(z.string().min(1)).min(1, 'En az bir varyant seçin'),
  offerPrice: z.number().min(0, 'Fırsat fiyatı 0 veya üzeri olmalı'),
  quantity: z.number().int().min(1).max(50).default(1),
  countdown: countdownSchema,
  headline: z.string().min(1, 'Başlık zorunlu').max(80),
  subtitle: z.string().max(120).default(''),
  ctaLabel: z.string().min(1).max(30).default('SEPETE EKLE'),
  tabLabel: z.string().min(1).max(24).default('FIRSAT ÜRÜN'),
});

export type OfferProductConfig = z.infer<typeof offerProductConfigSchema>;

export const OFFER_PRODUCT_DEFAULT_CONFIG: OfferProductConfig = {
  productId: '',
  variantIds: [],
  offerPrice: 0,
  quantity: 1,
  countdown: { mode: 'perSession', durationSec: 3600 },
  headline: 'Fırsat Ürün! 🎁',
  subtitle: 'Sınırlı süre için özel fiyat.',
  ctaLabel: 'SEPETE EKLE',
  tabLabel: 'FIRSAT ÜRÜN',
};
