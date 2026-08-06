'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { AppearanceIcon } from '@/lib/campaigns/appearance';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

const ICONS: Array<{ value: AppearanceIcon; label: TranslationKey }> = [
  { value: 'clock', label: 'appearance.iconClock' },
  { value: 'gift', label: 'appearance.iconGift' },
  { value: 'bolt', label: 'appearance.iconBolt' },
  { value: 'none', label: 'appearance.iconNone' },
];

const RADII = [0, 8, 16] as const;

export function AppearanceSection({ form }: { form: UseFormReturn<CampaignFormValues> }) {
  const t = useT();
  const mount = form.watch('appearance.mount');
  const side = mount?.mode === 'fixed' ? mount.side : 'left';
  const radius = form.watch('appearance.radius');
  const autoOpen = form.watch('appearance.autoOpen');

  return (
    <Section title={t('appearance.title')}>
      <Field label={t('appearance.position')}>
        <RadioGroup
          value={side}
          onValueChange={(value) => form.setValue('appearance.mount', { mode: 'fixed', side: value as 'left' | 'right' }, { shouldDirty: true })}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="left" id="side-left" />
            <Label htmlFor="side-left" className="text-xs font-normal">
              {t('appearance.left')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="right" id="side-right" />
            <Label htmlFor="side-right" className="text-xs font-normal">
              {t('appearance.right')}
            </Label>
          </div>
        </RadioGroup>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('appearance.accent')}>
          <div className="flex items-center gap-2">
            <Input type="color" className="h-9 w-12 p-1" {...form.register('appearance.accentColor')} />
            <Input className="flex-1" {...form.register('appearance.accentColor')} />
          </div>
        </Field>

        <Field label={t('appearance.radius')}>
          <Select
            value={String(radius)}
            onValueChange={(value) => form.setValue('appearance.radius', Number(value) as 0 | 8 | 16, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADII.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label={t('appearance.icon')}>
        <Select
          value={form.watch('appearance.icon')}
          onValueChange={(value) => form.setValue('appearance.icon', value as AppearanceIcon, { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ICONS.map((icon) => (
              <SelectItem key={icon.value} value={icon.value}>
                {t(icon.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="flex items-center justify-between gap-4 rounded-md border p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">{t('appearance.autoOpen')}</span>
          <span className="text-xs text-muted-foreground">{t('appearance.autoOpenHint')}</span>
        </div>
        <Switch checked={autoOpen} onCheckedChange={(checked) => form.setValue('appearance.autoOpen', checked, { shouldDirty: true })} />
      </div>

      {autoOpen ? (
        <Field label={t('appearance.autoOpenDelay')}>
          <Input type="number" min="0" max="60" {...form.register('appearance.autoOpenDelaySec', { valueAsNumber: true })} />
        </Field>
      ) : null}
    </Section>
  );
}
