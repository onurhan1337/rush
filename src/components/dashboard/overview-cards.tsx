'use client';

import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { CampaignStat } from '@/models/campaign-event';
import type { CampaignTotals } from '@/app/api/ikas/stats/route';
import type { Campaign } from '@/models/campaign';

type Props = {
  campaigns: Campaign[];
  totals: Record<string, CampaignTotals>;
  daily: Record<string, CampaignStat[]>;
};

const EMPTY: CampaignTotals = { impressions: 0, opens: 0, clicks: 0, addToCarts: 0, dismisses: 0, revenue: 0 };

function sumTotals(totals: Record<string, CampaignTotals>): CampaignTotals {
  return Object.values(totals).reduce<CampaignTotals>(
    (acc, item) => ({
      impressions: acc.impressions + item.impressions,
      opens: acc.opens + item.opens,
      clicks: acc.clicks + item.clicks,
      addToCarts: acc.addToCarts + item.addToCarts,
      dismisses: acc.dismisses + item.dismisses,
      revenue: acc.revenue + item.revenue,
    }),
    { ...EMPTY },
  );
}

function rate(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}

function dailySeries(daily: Record<string, CampaignStat[]>, days: number): number[] {
  const byDay = new Map<string, number>();

  for (const rows of Object.values(daily)) {
    for (const row of rows) {
      const key = row.date.slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + row.impressions);
    }
  }

  const series: number[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
    series.push(byDay.get(date) ?? 0);
  }
  return series;
}

function Sparkline({ values }: { values: number[] }) {
  const peak = Math.max(...values, 1);

  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden>
      {values.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-sm bg-foreground/15"
          style={{ height: `${Math.max(6, (value / peak) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-medium tabular-nums tracking-tight">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function OverviewCards({ campaigns, totals, daily }: Props) {
  const t = useT();
  const summed = sumTotals(totals);
  const active = campaigns.filter((campaign) => campaign.status === 'ACTIVE').length;

  const openRate = rate(summed.opens, summed.impressions);
  const cartRate = rate(summed.addToCarts, summed.opens);

  const cards: Array<{ label: TranslationKey; value: string; hint?: string }> = [
    { label: 'overview.active', value: `${active}`, hint: `${campaigns.length} ${t('overview.totalCampaigns')}` },
    { label: 'overview.impressions', value: `${summed.impressions}`, hint: t('overview.last14') },
    { label: 'overview.openRate', value: `%${openRate}`, hint: `${summed.opens} ${t('funnel.opens').toLowerCase()}` },
    { label: 'overview.cartRate', value: `%${cartRate}`, hint: `${summed.addToCarts} ${t('funnel.addToCarts').toLowerCase()}` },
  ];

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} label={t(card.label)} value={card.value} hint={card.hint} />
        ))}
      </div>

      {summed.impressions ? (
        <div className="rounded-lg border p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-xs font-medium">{t('overview.trend')}</span>
            <span className="text-xs text-muted-foreground">{t('overview.last14')}</span>
          </div>
          <Sparkline values={dailySeries(daily, 14)} />
        </div>
      ) : null}
    </div>
  );
}
