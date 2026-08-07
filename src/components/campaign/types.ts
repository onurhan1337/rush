import type { Appearance } from '@/lib/campaigns/appearance';
import type { RuleSet } from '@/lib/campaigns/rules/types';
import type { OfferProductConfig } from '@/lib/campaigns/types/offer-product/schema';
import type { CampaignStatus } from '@/models/campaign';

export type CampaignFormValues = {
  name: string;
  status: CampaignStatus;
  startsAt?: string;
  endsAt?: string;
  config: OfferProductConfig;
  rules: RuleSet;
  appearance: Appearance;
  priority: number;
};
