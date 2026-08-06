'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { appearanceSchema } from '@/lib/campaigns/appearance-schema';
import { ruleSetSchema } from '@/lib/campaigns/rules/schema';
import { offerProductConfigSchema } from '@/lib/campaigns/types/offer-product/schema';
import { ApiRequests } from '@/lib/api-requests';
import { useT } from '@/lib/i18n';
import type { Campaign } from '@/models/campaign';
import type { CampaignFormValues } from '../types';

const formSchema = z.object({
  name: z.string().min(1, 'Kampanya adı zorunlu').max(80),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  config: offerProductConfigSchema,
  rules: ruleSetSchema,
  appearance: appearanceSchema,
  priority: z.number().int().min(0).max(100),
});

function toLocalInput(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(local?: string): string | undefined {
  if (!local) return undefined;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function campaignToFormValues(campaign: Campaign): CampaignFormValues {
  const config = offerProductConfigSchema.safeParse(campaign.config);
  return {
    name: campaign.name,
    status: campaign.status,
    startsAt: toLocalInput(campaign.startsAt),
    endsAt: toLocalInput(campaign.endsAt),
    config: config.success ? config.data : (campaign.config as CampaignFormValues['config']),
    rules: campaign.rules,
    appearance: campaign.appearance,
    priority: campaign.priority,
  };
}

export function useCampaignForm(campaign: Campaign, token: string) {
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastPayloadRef = useRef<string>('');

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: campaignToFormValues(campaign),
    mode: 'onChange',
  });

  // Autosave deliberately bypasses handleSubmit: handleSubmit skips the callback when
  // validation fails, which would silently discard every edit made to an incomplete draft.
  const save = useCallback(
    async (values: CampaignFormValues) => {
      const payload = {
        name: values.name,
        startsAt: toIso(values.startsAt),
        endsAt: toIso(values.endsAt),
        config: values.config as unknown as Record<string, unknown>,
        rules: values.rules,
        appearance: values.appearance,
        priority: values.priority,
      };

      const serialized = JSON.stringify(payload);
      if (serialized === lastPayloadRef.current) return;

      setSaving(true);
      try {
        await ApiRequests.ikas.updateCampaign(token, campaign.id, payload);
        lastPayloadRef.current = serialized;
        setSavedAt(new Date());
      } catch {
        toast.error(t('editor.saveFailed'));
      } finally {
        setSaving(false);
      }
    },
    [campaign.id, token, t],
  );

  const values = form.watch();

  useEffect(() => {
    if (!form.formState.isDirty) return;

    const timer = setTimeout(() => {
      void save(form.getValues());
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), form.formState.isDirty]);

  return { form, saving, savedAt, save };
}
