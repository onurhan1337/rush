import type { IkasMedia } from '@/lib/ikas-image';
import type { Appearance } from './appearance';
import type { RuleSet } from './rules/types';
import type { VariantSelection, VariantStyle } from './types/offer-product/schema';

export type WidgetVariant = {
  id: string;
  label: string;
  media?: IkasMedia;
  swatchColor?: string;
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
  currencySymbol: string;
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
  variantStyle: VariantStyle;
  variantSelection: VariantSelection;
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
