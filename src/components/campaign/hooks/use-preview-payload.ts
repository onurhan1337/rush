'use client';

import { useMemo } from 'react';
import { getCampaignType } from '@/lib/campaigns/registry';
import type { ResolvedProduct } from '@/lib/campaigns/product';
import type { WidgetConfigPayload } from '@/lib/campaigns/widget-types';
import type { Campaign } from '@/models/campaign';
import type { CampaignFormValues } from '../types';

export function usePreviewPayload(
  campaign: Campaign,
  values: CampaignFormValues,
  products: Record<string, ResolvedProduct>,
): WidgetConfigPayload {
  const serialized = JSON.stringify(values);
  const productKey = Object.keys(products).sort().join(',');

  return useMemo(() => {
    const empty: WidgetConfigPayload = { campaigns: [], eventsUrl: '' };
    if (!productKey) return empty;

    const definition = getCampaignType(campaign.type);
    if (!definition) return empty;

    const parsed = definition.configSchema.safeParse(values.config);
    if (!parsed.success) return empty;

    const draft: Campaign = {
      ...campaign,
      name: values.name,
      startsAt: values.startsAt,
      endsAt: values.endsAt,
      rules: values.rules,
      appearance: values.appearance,
      config: values.config as unknown as Record<string, unknown>,
    };

    const widgetCampaign = definition.toWidgetPayload(draft, parsed.data, Object.values(products));
    return widgetCampaign ? { campaigns: [widgetCampaign], eventsUrl: '' } : empty;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, serialized, productKey]);
}
