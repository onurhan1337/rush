import type { Appearance } from './appearance';
import type { RuleSet } from './rules/types';

export type WidgetVariant = {
  id: string;
  label: string;
  imageUrl?: string;
  swatchColor?: string;
  sellPrice: number;
  offerPrice: number;
  inStock: boolean;
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
  productName: string;
  productUrl: string;
  hasOptions: boolean;
  quantity: number;
  currencySymbol: string;
  countdown: WidgetCountdown;
  variants: WidgetVariant[];
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
