'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

export function ContentSection({ form }: { form: UseFormReturn<CampaignFormValues> }) {
  const t = useT();
  const { register, formState } = form;

  return (
    <Section title={t('content.title')} description={t('content.description')}>
      <Field label={t('content.headline')} error={formState.errors.config?.headline?.message}>
        <Input placeholder="Fırsat Ürün! 🎁" {...register('config.headline')} />
      </Field>

      <Field label={t('content.subtitle')}>
        <Textarea rows={2} {...register('config.subtitle')} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('content.cta')}>
          <Input {...register('config.ctaLabel')} />
        </Field>
        <Field label={t('content.tabLabel')}>
          <Input {...register('config.tabLabel')} />
        </Field>
      </div>
    </Section>
  );
}
