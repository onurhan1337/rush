export const CAMPAIGN_EVENT_TYPES = ['IMPRESSION', 'OPEN', 'CLICK', 'ADD_TO_CART', 'DISMISS'] as const;

export type CampaignEventType = (typeof CAMPAIGN_EVENT_TYPES)[number];

export interface CampaignEvent {
  id: string;
  campaignId: string;
  authorizedAppId: string;
  type: CampaignEventType;
  sessionId: string;
  variantId?: string;
  value?: number;
  createdAt: string;
}

export interface CampaignStat {
  campaignId: string;
  date: string;
  impressions: number;
  opens: number;
  clicks: number;
  addToCarts: number;
  dismisses: number;
  revenue: number;
}

export const STAT_FIELD_BY_EVENT: Record<CampaignEventType, keyof Omit<CampaignStat, 'campaignId' | 'date' | 'revenue'>> = {
  IMPRESSION: 'impressions',
  OPEN: 'opens',
  CLICK: 'clicks',
  ADD_TO_CART: 'addToCarts',
  DISMISS: 'dismisses',
};
