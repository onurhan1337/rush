import type { WidgetCampaign } from '@/lib/campaigns/widget-types';
import { renderOfferProduct, type RenderedCampaign } from './offer-product';

type Renderer = (campaign: WidgetCampaign) => RenderedCampaign | null;

const renderers: Record<string, Renderer> = {
  'offer-product': renderOfferProduct,
};

export function getRenderer(type: string): Renderer | undefined {
  return renderers[type];
}
