'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { hover, readableOn, tint } from '@/lib/color';
import { APPEARANCE_ICONS, CTA_STYLES, RADII, radiusScale, type AppearanceIcon, type CtaStyle } from '@/lib/campaigns/appearance';
import { ICON_PATHS } from '@/widget/render/icons';
import { cn } from '@/lib/utils';
import { ColorField } from '../color-field';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';
import { Segmented } from './segmented';

const ICON_LABELS: Record<AppearanceIcon, TranslationKey> = {
  clock: 'appearance.iconClock',
  gift: 'appearance.iconGift',
  bolt: 'appearance.iconBolt',
  flame: 'appearance.iconFlame',
  tag: 'appearance.iconTag',
  sparkle: 'appearance.iconSparkle',
  percent: 'appearance.iconPercent',
  star: 'appearance.iconStar',
  cart: 'appearance.iconCart',
  crown: 'appearance.iconCrown',
  none: 'appearance.iconNone',
};

const CTA_STYLE_LABELS: Record<CtaStyle, TranslationKey> = {
  solid: 'appearance.ctaSolid',
  gradient: 'appearance.ctaGradient',
  outline: 'appearance.ctaOutline',
  soft: 'appearance.ctaSoft',
};

function ctaSwatch(style: CtaStyle, accent: string, secondary: string, radius: number) {
  const base = { borderRadius: `${Math.min(radius, 8)}px`, border: '1.5px solid transparent' };

  if (style === 'gradient') return { ...base, background: `linear-gradient(120deg, ${accent}, ${secondary})`, color: readableOn(accent) };
  if (style === 'outline') return { ...base, background: 'transparent', color: accent, borderColor: accent };
  if (style === 'soft') return { ...base, background: tint(accent, 0.9), color: hover(accent) };
  return { ...base, background: accent, color: readableOn(accent) };
}

export function AppearanceSection({ form }: { form: UseFormReturn<CampaignFormValues> }) {
  const t = useT();
  const mount = form.watch('appearance.mount');
  const side = mount?.mode === 'fixed' ? mount.side : 'left';
  const autoOpen = form.watch('appearance.autoOpen');
  const accent = form.watch('appearance.accentColor') ?? '#0A0A0A';
  const secondary = form.watch('appearance.secondaryColor') ?? '#0A0A0A';
  const radius = form.watch('appearance.radius') ?? 16;
  const icon = form.watch('appearance.icon');
  const ctaStyle = form.watch('appearance.ctaStyle');

  return (
    <Section title={t('appearance.title')} description={t('appearance.description')}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('appearance.position')}>
          <Segmented
            value={side}
            onChange={(value) => form.setValue('appearance.mount', { mode: 'fixed', side: value }, { shouldDirty: true })}
            options={[
              { value: 'left' as const, label: t('appearance.left') },
              { value: 'right' as const, label: t('appearance.right') },
            ]}
          />
        </Field>

        <Field label={t('appearance.radius')}>
          <Segmented
            value={radius}
            onChange={(value) => form.setValue('appearance.radius', value, { shouldDirty: true })}
            options={RADII.map((value) => ({ value, label: value }))}
          />
        </Field>

        <Field label={t('appearance.accent')} hint={t('appearance.accentHint')} error={form.formState.errors.appearance?.accentColor?.message}>
          <ColorField value={accent} onChange={(value) => form.setValue('appearance.accentColor', value, { shouldDirty: true })} />
        </Field>

        <Field
          label={t('appearance.secondary')}
          hint={t('appearance.secondaryHint')}
          error={form.formState.errors.appearance?.secondaryColor?.message}
        >
          <ColorField value={secondary} onChange={(value) => form.setValue('appearance.secondaryColor', value, { shouldDirty: true })} />
        </Field>
      </div>

      <Field label={t('appearance.ctaStyle')}>
        <div className="grid grid-cols-4 gap-2">
          {CTA_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => form.setValue('appearance.ctaStyle', style, { shouldDirty: true })}
              aria-pressed={ctaStyle === style}
              className={cn(
                'flex flex-col items-stretch gap-1.5 rounded-md border p-1.5 transition-colors',
                ctaStyle === style ? 'border-foreground ring-1 ring-foreground' : 'hover:bg-accent',
              )}
            >
              <span className="h-7 rounded" style={ctaSwatch(style, accent, secondary, radiusScale(radius).control)} />
              <span className="text-[10px] text-muted-foreground">{t(CTA_STYLE_LABELS[style])}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('appearance.icon')}>
        <div className="flex flex-wrap gap-1.5">
          {APPEARANCE_ICONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => form.setValue('appearance.icon', value, { shouldDirty: true })}
              aria-pressed={icon === value}
              title={t(ICON_LABELS[value])}
              className={cn(
                'flex size-8 items-center justify-center rounded-md border transition-colors',
                icon === value ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {value === 'none' ? (
                <span className="text-[9px] font-medium">{t('appearance.iconNone')}</span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                  dangerouslySetInnerHTML={{ __html: ICON_PATHS[value] }}
                />
              )}
            </button>
          ))}
        </div>
      </Field>

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
