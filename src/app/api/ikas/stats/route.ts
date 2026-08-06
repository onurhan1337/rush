import { NextResponse } from 'next/server';
import { withMerchant } from '@/lib/api-route-helpers';
import { CampaignEventManager } from '@/models/campaign-event/manager';
import { CampaignManager } from '@/models/campaign/manager';
import type { CampaignStat } from '@/models/campaign-event';

export type CampaignTotals = {
  impressions: number;
  opens: number;
  clicks: number;
  addToCarts: number;
  dismisses: number;
  revenue: number;
};

export type StatsApiResponse = {
  daily: Record<string, CampaignStat[]>;
  totals: Record<string, CampaignTotals>;
};

function sum(rows: CampaignStat[]): CampaignTotals {
  return rows.reduce<CampaignTotals>(
    (totals, row) => ({
      impressions: totals.impressions + row.impressions,
      opens: totals.opens + row.opens,
      clicks: totals.clicks + row.clicks,
      addToCarts: totals.addToCarts + row.addToCarts,
      dismisses: totals.dismisses + row.dismisses,
      revenue: totals.revenue + row.revenue,
    }),
    { impressions: 0, opens: 0, clicks: 0, addToCarts: 0, dismisses: 0, revenue: 0 },
  );
}

export const GET = withMerchant(async (request, context) => {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const range = Math.min(Math.max(Number(searchParams.get('range')) || 14, 1), 90);

  const campaigns = await CampaignManager.list(context.authorizedAppId);
  const ids = campaignId ? campaigns.filter((campaign) => campaign.id === campaignId).map((campaign) => campaign.id) : campaigns.map((campaign) => campaign.id);

  const daily = await CampaignEventManager.stats(ids, range);
  const totals: Record<string, CampaignTotals> = {};
  for (const id of ids) totals[id] = sum(daily[id] ?? []);

  return NextResponse.json({ data: { daily, totals } });
});
