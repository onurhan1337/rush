import type { AnyCampaignTypeDefinition } from './definition';
import { offerProductDefinition } from './types/offer-product/definition';

const definitions: AnyCampaignTypeDefinition[] = [offerProductDefinition];

const byKey = new Map<string, AnyCampaignTypeDefinition>(definitions.map((definition) => [definition.key, definition]));

export function getCampaignType(key: string): AnyCampaignTypeDefinition | undefined {
  return byKey.get(key);
}

export function listCampaignTypes(): AnyCampaignTypeDefinition[] {
  return definitions;
}

export const DEFAULT_CAMPAIGN_TYPE = offerProductDefinition.key;
