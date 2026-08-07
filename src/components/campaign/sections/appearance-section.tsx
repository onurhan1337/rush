'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { CTA_STYLES, type AppearanceIcon, type CtaStyle } from '@/lib/campaigns/appearance';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

const ICON_LABELS: Record<AppearanceIcon, TranslationKey> = {
  clock: 'appearance.iconClock',
  gift: 'appearance.iconGift',
  bolt: 'appearance.iconBolt',
  none: 'appearance.iconNone',
};

const CTA_STYLE_LABELS: Record<CtaStyle, TranslationKey> = {
  solid: 'appearance.ctaSolid',
  outline: 'appearance.ctaOutline',
  soft: 'appearance.ctaSoft',
};

const ICONS = Object.keys(ICON_LABELS) as AppearanceIcon[];
const RADII = [0, 8, 16] as const;

export function AppearanceSection({ form }: { form: UseFormReturn<CampaignFormValues> }) {
  const t = useT();
  const mount = form.watch('appearance.mount');
  const side = mount?.mode === 'fixed' ? mount.side : 'left';
  const autoOpen = form.watch('appearance.autoOpen');

  return (
    <Section title={t('appearance.title')} description={t('appearance.description')}>
      <Field label={t('appearance.position')}>
        <RadioGroup
          value={side}
          onValueChange={(value) => form.setValue('appearance.mount', { mode: 'fixed', side: value as 'left' | 'right' }, { shouldDirty: true })}
          className="flex gap-6"
        >
          {(['left', 'right'] as const).map((value) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`side-${value}`} />
              <Label htmlFor={`side-${value}`} className="text-xs font-normal">
                {t(value === 'left' ? 'appearance.left' : 'appearance.right')}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('appearance.accent')}>
          <div className="flex items-center gap-2">
            <Input type="color" className="h-9 w-12 shrink-0 p-1" {...form.register('appearance.accentColor')} />
            <Input className="min-w-0 flex-1 font-mono text-xs uppercase" {...form.register('appearance.accentColor')} />
          </div>
        </Field>

        <Field label={t('appearance.radius')}>
          <Select
            value={String(form.watch('appearance.radius'))}
            onValueChange={(value) => form.setValue('appearance.radius', Number(value) as 0 | 8 | 16, { shouldDirty: true })}
          >
            <SelectTrigger className="w-full">
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

        <Field label={t('appearance.icon')}>
          <Select
            value={form.watch('appearance.icon')}
            onValueChange={(value) => form.setValue('appearance.icon', value as AppearanceIcon, { shouldDirty: true })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICONS.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  {t(ICON_LABELS[icon])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t('appearance.ctaStyle')}>
          <Select
            value={form.watch('appearance.ctaStyle')}
            onValueChange={(value) => form.setValue('appearance.ctaStyle', value as CtaStyle, { shouldDirty: true })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CTA_STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {t(CTA_STYLE_LABELS[style])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">{t('appearance.autoOpen')}</span>
            <span className="text-xs text-muted-foreground">{t('appearance.autoOpenHint')}</span>
          </div>
          <Switch checked={autoOpen} onCheckedChange={(checked) => form.setValue('appearance.autoOpen', checked, { shouldDirty: true })} />
        </div>

        {autoOpen ? (
          <div className="border-t p-4">
            <Field label={t('appearance.autoOpenDelay')}>
              <Input type="number" min="0" max="60" className="w-32" {...form.register('appearance.autoOpenDelaySec', { valueAsNumber: true })} />
            </Field>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
