'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

function defaultEndsAt(): string {
  const date = new Date(Date.now() + 7 * 86400000 - new Date().getTimezoneOffset() * 60000);
  return date.toISOString().slice(0, 16);
}

export function CountdownSection({ form }: { form: UseFormReturn<CampaignFormValues> }) {
  const t = useT();
  const mode = form.watch('config.countdown.mode');

  // Switching to a fixed countdown with no date would make the whole form invalid, so
  // seed a sensible date instead of leaving the merchant in a broken state.
  const changeMode = (next: 'fixed' | 'perSession') => {
    form.setValue('config.countdown.mode', next, { shouldDirty: true });

    if (next === 'fixed' && !form.getValues('config.countdown.endsAt')) {
      form.setValue('config.countdown.endsAt', defaultEndsAt(), { shouldDirty: true });
    }
    if (next === 'perSession' && !form.getValues('config.countdown.durationSec')) {
      form.setValue('config.countdown.durationSec', 3600, { shouldDirty: true });
    }

    void form.trigger('config.countdown');
  };

  return (
    <Section title={t('countdown.title')}>
      <RadioGroup value={mode} onValueChange={(value) => changeMode(value as 'fixed' | 'perSession')} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="fixed" id="countdown-fixed" />
          <Label htmlFor="countdown-fixed" className="text-xs font-normal">
            {t('countdown.fixed')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="perSession" id="countdown-session" />
          <Label htmlFor="countdown-session" className="text-xs font-normal">
            {t('countdown.perSession')}
          </Label>
        </div>
      </RadioGroup>

      {mode === 'fixed' ? (
        <Field label={t('countdown.endsAt')} error={form.formState.errors.config?.countdown?.message}>
          <Input type="datetime-local" {...form.register('config.countdown.endsAt')} />
        </Field>
      ) : (
        <Field label={t('countdown.duration')} hint={t('countdown.durationHint')} error={form.formState.errors.config?.countdown?.message}>
          <Input type="number" min="30" step="30" {...form.register('config.countdown.durationSec', { valueAsNumber: true })} />
        </Field>
      )}
    </Section>
  );
}
