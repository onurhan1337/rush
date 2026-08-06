'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Funnel } from '@/components/campaign/stats/funnel';
import { ScopeBanner } from '@/components/dashboard/scope-banner';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { ApiRequests } from '@/lib/api-requests';
import { DEFAULT_CAMPAIGN_TYPE, getCampaignType } from '@/lib/campaigns/registry';
import type { CampaignTotals } from '@/app/api/ikas/stats/route';
import type { CampaignStat } from '@/models/campaign-event';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { Campaign } from '@/models/campaign';

export function CampaignList({ token }: { token: string }) {
  const t = useT();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [totals, setTotals] = useState<Record<string, CampaignTotals>>({});
  const [daily, setDaily] = useState<Record<string, CampaignStat[]>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([ApiRequests.ikas.listCampaigns(token), ApiRequests.ikas.getStats(token, { range: 14 })])
      .then(([listResponse, statsResponse]) => {
        if (cancelled) return;
        setCampaigns(listResponse.data?.data?.campaigns ?? []);
        setTotals(statsResponse.data?.data?.totals ?? {});
        setDaily(statsResponse.data?.data?.daily ?? {});
      })
      .catch(() => {
        if (!cancelled) setCampaigns([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const create = useCallback(async () => {
    setCreating(true);
    try {
      const definition = getCampaignType(DEFAULT_CAMPAIGN_TYPE);
      const response = await ApiRequests.ikas.createCampaign(token, {
        type: DEFAULT_CAMPAIGN_TYPE,
        name: t('list.defaultName'),
        config: definition?.defaultConfig as Record<string, unknown>,
      });
      const created = response.data?.data?.campaign;
      if (created) router.push(`/dashboard/campaigns/${created.id}`);
    } catch {
      toast.error(t('list.createFailed'));
      setCreating(false);
    }
  }, [router, token, t]);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <ScopeBanner token={token} />

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium tracking-tight">{t('list.title')}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t('list.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label={t('common.settings')}>
            <Link href="/dashboard/settings">
              <Settings className="size-4" />
            </Link>
          </Button>
          <Button onClick={create} disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t('list.new')}
          </Button>
        </div>
      </div>

      {campaigns?.length ? <OverviewCards campaigns={campaigns} totals={totals} daily={daily} /> : null}

      {campaigns === null ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center">
          <p className="text-sm font-medium">{t('list.emptyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('list.emptyBody')}</p>
          <Button className="mt-6" onClick={create} disabled={creating}>
            <Plus className="size-4" />
            {t('list.new')}
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <Link
                href={`/dashboard/campaigns/${campaign.id}`}
                className="block rounded-lg border p-5 transition-colors hover:border-foreground/30"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">{campaign.name}</span>
                  <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>{t(`status.${campaign.status}` as TranslationKey)}</Badge>
                </div>
                <Funnel totals={totals[campaign.id]} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
