import type { Appearance } from '@/lib/campaigns/appearance';
import type { RuleSet } from '@/lib/campaigns/rules/types';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface Campaign {
  id: string;
  merchantId: string;
  authorizedAppId: string;
  type: string;
  name: string;
  status: CampaignStatus;
  startsAt?: string;
  endsAt?: string;
  config: Record<string, unknown>;
  rules: RuleSet;
  appearance: Appearance;
  ikasCampaignIds: string[];
  publishedSnapshot?: string;
  publishedVersion?: string;
  publishedAt?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export type CampaignInput = Omit<Campaign, 'createdAt' | 'updatedAt' | 'deleted'> & {
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
};
