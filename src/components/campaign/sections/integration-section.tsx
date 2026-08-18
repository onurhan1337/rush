'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useIntlLocale, useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { APPLICABLE_PRICES, type ApplicablePrice } from '@/lib/campaigns/ikas-settings';
import { AFTER_ADD_TO_CART, AFTER_CONVERSION, type AfterAddToCart, type AfterConversion } from '@/lib/campaigns/types/offer-product/schema';
import type { CartTotalRule } from '@/lib/campaigns/rules/types';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

const AFTER_ADD_LABELS: Record<AfterAddToCart, TranslationKey> = {
  drawer: 'integration.afterDrawer',
  cart: 'integration.afterCart',
  stay: 'integration.afterStay',
};

const AFTER_CONVERSION_LABELS: Record<AfterConversion, TranslationKey> = {
  keep: 'integration.conversionKeep',
  hideSession: 'integration.conversionSession',
  hideDay: 'integration.conversionDay',
};

const AFTER_CONVERSION_HINTS: Record<AfterConversion, TranslationKey> = {
  keep: 'integration.conversionKeepHint',
  hideSession: 'integration.conversionSessionHint',
  hideDay: 'integration.conversionDayHint',
};

const APPLICABLE_PRICE_LABELS: Record<ApplicablePrice, TranslationKey> = {
  SELL_PRICE: 'integration.priceSell',
  DISCOUNT_PRICE: 'integration.priceDiscount',
};

const TOGGLES: Array<{ name: 'canCombineWithOtherCampaigns' | 'includeDiscountedProducts' | 'isFreeShipping'; label: TranslationKey; hint: TranslationKey }> = [
  { name: 'canCombineWithOtherCampaigns', label: 'integration.combine', hint: 'integration.combineHint' },
  { name: 'includeDiscountedProducts', label: 'integration.includeDiscounted', hint: 'integration.includeDiscountedHint' },
  { name: 'isFreeShipping', label: 'integration.freeShipping', hint: 'integration.freeShippingHint' },
];

export function IntegrationSection({ form }: { form: UseFormReturn<CampaignFormValues> }) {
  const t = useT();
  const locale = useIntlLocale();
  const rules = form.watch('rules');
  const freeShipping = form.watch('config.ikas.isFreeShipping');
  const threshold = rules?.conditions?.find((rule): rule is CartTotalRule => rule.kind === 'cart_total' && rule.op === 'gte');

  const freeShippingNote = !freeShipping
    ? null
    : threshold
      ? `${t('integration.freeShippingThreshold')} ${new Intl.NumberFormat(locale).format(threshold.amount)}`
      : t('integration.freeShippingNoThreshold');

  return (
    <Section title={t('integration.title')} description={t('integration.description')}>
      <Field label={t('integration.afterAddToCart')} hint={t('integration.afterAddToCartHint')}>
        <Select
          value={form.watch('config.afterAddToCart')}
          onValueChange={(value) => form.setValue('config.afterAddToCart', value as AfterAddToCart, { shouldDirty: true })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AFTER_ADD_TO_CART.map((value) => (
              <SelectItem key={value} value={value}>
                {t(AFTER_ADD_LABELS[value])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {form.watch('config.afterAddToCart') === 'drawer' ? (
        <Field
          label={t('integration.cartTrigger')}
          hint={t('integration.optional')}
          error={form.formState.errors.config?.cartTriggerSelector?.message}
        >
          <Input placeholder=".header-cart-button" className="font-mono text-xs" {...form.register('config.cartTriggerSelector')} />
        </Field>
      ) : null}

      <Field label={t('integration.afterConversion')} hint={t(AFTER_CONVERSION_HINTS[form.watch('config.afterConversion')])}>
        <Select
          value={form.watch('config.afterConversion')}
          onValueChange={(value) => form.setValue('config.afterConversion', value as AfterConversion, { shouldDirty: true })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AFTER_CONVERSION.map((value) => (
              <SelectItem key={value} value={value}>
                {t(AFTER_CONVERSION_LABELS[value])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="divide-y rounded-md border">
        {TOGGLES.map((toggle) => (
          <div key={toggle.name} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium">{t(toggle.label)}</span>
                <span className="text-xs text-muted-foreground">{t(toggle.hint)}</span>
              </div>
              <Switch
                checked={form.watch(`config.ikas.${toggle.name}`)}
                onCheckedChange={(checked) => form.setValue(`config.ikas.${toggle.name}`, checked, { shouldDirty: true })}
              />
            </div>

            {toggle.name === 'isFreeShipping' && freeShippingNote ? (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{freeShippingNote}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('integration.applicablePrice')}>
          <Select
            value={form.watch('config.ikas.applicablePrice')}
            onValueChange={(value) => form.setValue('config.ikas.applicablePrice', value as ApplicablePrice, { shouldDirty: true })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLICABLE_PRICES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(APPLICABLE_PRICE_LABELS[value])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('integration.usageLimit')} error={form.formState.errors.config?.ikas?.usageLimit?.message}>
            <Input
              type="number"
              min="1"
              placeholder="∞"
              {...form.register('config.ikas.usageLimit', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
            />
          </Field>
          <Field label={t('integration.usageLimitPerCustomer')} error={form.formState.errors.config?.ikas?.usageLimitPerCustomer?.message}>
            <Input
              type="number"
              min="1"
              placeholder="∞"
              {...form.register('config.ikas.usageLimitPerCustomer', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
            />
          </Field>
        </div>
      </div>
    </Section>
  );
}
