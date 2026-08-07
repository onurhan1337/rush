'use client';

import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { CampaignTotals } from '@/app/api/ikas/stats/route';

const STEPS: Array<{ key: keyof CampaignTotals; label: TranslationKey }> = [
  { key: 'impressions', label: 'funnel.impressions' },
  { key: 'opens', label: 'funnel.opens' },
  { key: 'clicks', label: 'funnel.clicks' },
  { key: 'addToCarts', label: 'funnel.addToCarts' },
];

export function Funnel({ totals }: { totals?: CampaignTotals }) {
  const t = useT();
  const values = totals ?? { impressions: 0, opens: 0, clicks: 0, addToCarts: 0, dismisses: 0, revenue: 0 };
  const peak = Math.max(values.impressions, 1);

  return (
    <div className="grid grid-cols-4 gap-3">
      {STEPS.map((step) => {
        const value = values[step.key];
        return (
          <div key={step.key} className="flex flex-col gap-1.5">
            <span className="text-lg font-medium tabular-nums">{value}</span>
            <span className="text-[11px] text-muted-foreground">{t(step.label)}</span>
            <div className="h-1 rounded-full bg-muted">
              <div className="h-1 rounded-full bg-foreground" style={{ width: `${Math.min(100, (value / peak) * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
