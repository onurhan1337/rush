'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

export function BasicsSection({ form }: { form: UseFormReturn<CampaignFormValues> }) {
  const t = useT();
  const { register, formState } = form;

  return (
    <Section title={t('basics.title')}>
      <Field label={t('basics.name')} error={formState.errors.name?.message}>
        <Input placeholder={t('basics.namePlaceholder')} {...register('name')} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('basics.startsAt')} hint={t('common.optional')}>
          <Input type="datetime-local" {...register('startsAt')} />
        </Field>
        <Field label={t('basics.endsAt')} hint={t('common.optional')}>
          <Input type="datetime-local" {...register('endsAt')} />
        </Field>
      </div>
    </Section>
  );
}
