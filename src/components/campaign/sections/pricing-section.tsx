'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useIntlLocale, useT } from '@/lib/i18n';
import { currencySymbol, formatMoney } from '@/lib/money';
import type { ResolvedProduct } from '@/lib/campaigns/product';
import type { OfferProductItem } from '@/lib/campaigns/types/offer-product/schema';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

type Summary = { state: 'mixed' } | { state: 'invalid' } | { state: 'ok'; discount: number; ratio: number };

function summarize(product: ResolvedProduct, item: OfferProductItem): Summary | null {
  const selected = product.variants.filter((variant) => item.variantIds.includes(variant.id));
  if (!selected.length) return null;

  const prices = Array.from(new Set(selected.map((variant) => variant.sellPrice)));
  if (prices.length > 1) return { state: 'mixed' };

  const sellPrice = prices[0];
  if (!sellPrice || item.offerPrice >= sellPrice) return { state: 'invalid' };

  const discount = sellPrice - item.offerPrice;
  return { state: 'ok', discount, ratio: Math.round((discount / sellPrice) * 100) };
}

export function PricingSection({ form, products }: { form: UseFormReturn<CampaignFormValues>; products: Record<string, ResolvedProduct> }) {
  const t = useT();
  const locale = useIntlLocale();
  const items: OfferProductItem[] = form.watch('config.items') ?? [];
  const override = form.watch('config.currencySymbol');

  const rows = items
    .map((item) => {
      const product = products[item.productId];
      if (!product) return null;
      const summary = summarize(product, item);
      return summary ? { product, item, summary } : null;
    })
    .filter((row): row is { product: ResolvedProduct; item: OfferProductItem; summary: Summary } => !!row);

  const storeCurrency = Object.values(products).find((product) => product.currencyCode || product.currencySymbol);
  const detected = currencySymbol({ code: storeCurrency?.currencyCode, symbol: storeCurrency?.currencySymbol });

  return (
    <Section title={t('pricing.title')} description={t('pricing.description')}>
      <Field
        label={t('pricing.currency')}
        hint={detected ? `${t('pricing.currencyDetected')}: ${detected}` : undefined}
        error={form.formState.errors.config?.currencySymbol?.message}
      >
        <Input className="w-32" placeholder={detected || '₺'} {...form.register('config.currencySymbol')} />
      </Field>

      {rows.length ? (
        <ul className="divide-y rounded-md border bg-muted/40 text-xs">
          {rows.map(({ product, item, summary }) => (
            <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="truncate font-medium">{product.name}</span>
              {summary.state === 'mixed' ? (
                <span className="shrink-0 text-destructive">{t('pricing.mixedPrices')}</span>
              ) : summary.state === 'invalid' ? (
                <span className="shrink-0 text-destructive">{t('pricing.invalidPrice')}</span>
              ) : (
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  −{formatMoney(summary.discount, { code: product.currencyCode, symbol: override || undefined }, locale)} (%{summary.ratio}) ·{' '}
                  {item.quantity}×
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}
