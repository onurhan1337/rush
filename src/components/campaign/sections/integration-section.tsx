'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { APPLICABLE_PRICES, type ApplicablePrice } from '@/lib/campaigns/ikas-settings';
import { AFTER_ADD_TO_CART, type AfterAddToCart } from '@/lib/campaigns/types/offer-product/schema';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

const AFTER_ADD_LABELS: Record<AfterAddToCart, TranslationKey> = {
  drawer: 'integration.afterDrawer',
  cart: 'integration.afterCart',
  stay: 'integration.afterStay',
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

      <div className="divide-y rounded-md border">
        {TOGGLES.map((toggle) => (
          <div key={toggle.name} className="flex items-center justify-between gap-4 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">{t(toggle.label)}</span>
              <span className="text-xs text-muted-foreground">{t(toggle.hint)}</span>
            </div>
            <Switch
              checked={form.watch(`config.ikas.${toggle.name}`)}
              onCheckedChange={(checked) => form.setValue(`config.ikas.${toggle.name}`, checked, { shouldDirty: true })}
            />
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
