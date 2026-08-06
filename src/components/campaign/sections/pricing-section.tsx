'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n';
import type { ResolvedProduct } from '@/lib/campaigns/product';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

function summarize(product: ResolvedProduct | undefined, variantIds: string[], offerPrice: number) {
  if (!product) return null;
  const selected = product.variants.filter((variant) => variantIds.includes(variant.id));
  if (!selected.length) return null;

  const prices = Array.from(new Set(selected.map((variant) => variant.sellPrice)));
  if (prices.length > 1) return { mixed: true as const };

  const sellPrice = prices[0];
  if (!sellPrice || offerPrice >= sellPrice) return { mixed: false as const, invalid: true as const, sellPrice, discount: 0, ratio: 0 };

  const discount = sellPrice - offerPrice;
  return { mixed: false as const, invalid: false as const, sellPrice, discount, ratio: Math.round((discount / sellPrice) * 100) };
}

export function PricingSection({ form, product }: { form: UseFormReturn<CampaignFormValues>; product?: ResolvedProduct }) {
  const t = useT();
  const offerPrice = form.watch('config.offerPrice');
  const variantIds = form.watch('config.variantIds') ?? [];
  const quantity = form.watch('config.quantity');
  const summary = summarize(product, variantIds, Number(offerPrice) || 0);
  const symbol = product?.currencySymbol ?? '';

  return (
    <Section title={t('pricing.title')} description={t('pricing.description')}>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('pricing.offerPrice')} hint={symbol} error={form.formState.errors.config?.offerPrice?.message}>
          <Input type="number" step="0.01" min="0" {...form.register('config.offerPrice', { valueAsNumber: true })} />
        </Field>
        <Field label={t('pricing.quantity')} hint={t('pricing.quantityHint')}>
          <Input type="number" step="1" min="1" max="50" {...form.register('config.quantity', { valueAsNumber: true })} />
        </Field>
      </div>

      {summary ? (
        <div className="rounded-md border bg-muted/40 p-4 text-xs">
          {summary.mixed ? (
            <span className="text-destructive">{t('pricing.mixedPrices')}</span>
          ) : summary.invalid ? (
            <span className="text-destructive">
              {t('pricing.offerPrice')} &lt; {summary.sellPrice} {symbol}
            </span>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{t('pricing.summaryTitle')}</span>
              <span className="text-muted-foreground">
                −{summary.discount.toFixed(2)} {symbol} (%{summary.ratio}) · {quantity}×
              </span>
            </div>
          )}
        </div>
      ) : null}
    </Section>
  );
}
