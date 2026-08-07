import type { IkasMedia } from '@/lib/ikas-image';
import type { Currency } from '@/lib/money';
import type { Appearance } from './appearance';
import type { RuleSet } from './rules/types';
import type { AfterAddToCart } from './types/offer-product/schema';
import type { ResolvedVariantType, VariantOption } from './variant-types';

export type WidgetVariant = {
  id: string;
  label: string;
  options: VariantOption[];
  media?: IkasMedia;
  sellPrice: number;
  offerPrice: number;
  inStock: boolean;
};

export type WidgetProduct = {
  id: string;
  name: string;
  url: string;
  hasOptions: boolean;
  quantity: number;
  currency: Currency;
  variantTypes: ResolvedVariantType[];
  variants: WidgetVariant[];
};

export type WidgetCountdown = {
  mode: 'fixed' | 'perSession';
  endsAt?: number;
  durationSec?: number;
};

export type OfferProductWidgetData = {
  headline: string;
  subtitle: string;
  ctaLabel: string;
  tabLabel: string;
  afterAddToCart: AfterAddToCart;
  cartTriggerSelector: string;
  countdown: WidgetCountdown;
  products: WidgetProduct[];
};

export type WidgetCampaign = {
  id: string;
  type: string;
  rules: RuleSet;
  appearance: Appearance;
  data: OfferProductWidgetData;
};

export type WidgetConfigPayload = {
  campaigns: WidgetCampaign[];
  eventsUrl: string;
};
