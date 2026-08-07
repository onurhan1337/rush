import { z } from 'zod';

export const APPLICABLE_PRICES = ['SELL_PRICE', 'DISCOUNT_PRICE'] as const;

export type ApplicablePrice = (typeof APPLICABLE_PRICES)[number];

export const ikasSettingsSchema = z.object({
  canCombineWithOtherCampaigns: z.boolean().default(false),
  includeDiscountedProducts: z.boolean().default(true),
  applicablePrice: z.enum(APPLICABLE_PRICES).default('SELL_PRICE'),
  isFreeShipping: z.boolean().default(false),
  usageLimit: z.number().int().min(1).max(1_000_000).optional(),
  usageLimitPerCustomer: z.number().int().min(1).max(1_000).optional(),
});

export type IkasSettings = z.infer<typeof ikasSettingsSchema>;

export const DEFAULT_IKAS_SETTINGS: IkasSettings = {
  canCombineWithOtherCampaigns: false,
  includeDiscountedProducts: true,
  applicablePrice: 'SELL_PRICE',
  isFreeShipping: false,
};
