'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiRequests } from '@/lib/api-requests';
import { useIntlLocale, useT } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { priceBasis, type ResolvedProduct } from '@/lib/campaigns/product';
import type { OfferProductItem } from '@/lib/campaigns/types/offer-product/schema';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

const DEFAULT_DISCOUNT_RATIO = 20;

function roundMoney(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

function basePriceOf(product: ResolvedProduct | undefined, variantIds: string[], applicablePrice: 'SELL_PRICE' | 'DISCOUNT_PRICE'): number | null {
  if (!product) return null;
  const selected = product.variants.filter((variant) => variantIds.includes(variant.id));
  if (!selected.length) return null;

  const prices = Array.from(new Set(selected.map((variant) => priceBasis(variant, applicablePrice))));
  return prices.length === 1 ? prices[0] : null;
}

type Props = {
  form: UseFormReturn<CampaignFormValues>;
  token: string;
  products: Record<string, ResolvedProduct>;
  onProductLoaded: (product: ResolvedProduct) => void;
};

export function ProductSection({ form, token, products, onProductLoaded }: Props) {
  const t = useT();
  const locale = useIntlLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResolvedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const items: OfferProductItem[] = form.watch('config.items') ?? [];
  const applicablePrice = form.watch('config.ikas.applicablePrice') ?? 'SELL_PRICE';
  const itemErrors = form.formState.errors.config?.items;

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const response = await ApiRequests.ikas.searchProducts(token, { q: query.trim() });
        if (!controller.signal.aborted) setResults(response.data?.data?.products ?? []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, token]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const addProduct = useCallback(
    (next: ResolvedProduct) => {
      onProductLoaded(next);
      setQuery('');
      setResults([]);

      const current = form.getValues('config.items') ?? [];
      if (current.some((item) => item.productId === next.id)) return;

      const firstInStock = next.variants.find((variant) => variant.inStock && variant.isActive) ?? next.variants[0];
      const applicablePrice = form.getValues('config.ikas.applicablePrice') ?? 'SELL_PRICE';
      const base = firstInStock ? priceBasis(firstInStock, applicablePrice) : 0;

      form.setValue(
        'config.items',
        [
          ...current,
          {
            productId: next.id,
            variantIds: firstInStock ? [firstInStock.id] : [],
            offerPrice: roundMoney(base * (1 - DEFAULT_DISCOUNT_RATIO / 100)),
            quantity: 1,
          },
        ],
        { shouldDirty: true, shouldValidate: true },
      );
    },
    [form, onProductLoaded],
  );

  const removeItem = useCallback(
    (index: number) => {
      const current = form.getValues('config.items') ?? [];
      form.setValue(
        'config.items',
        current.filter((_, itemIndex) => itemIndex !== index),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    [form],
  );

  const toggleVariant = useCallback(
    (index: number, variantId: string) => {
      const current = form.getValues(`config.items.${index}.variantIds`) ?? [];
      const next = current.includes(variantId) ? current.filter((id) => id !== variantId) : [...current, variantId];
      form.setValue(`config.items.${index}.variantIds`, next, { shouldDirty: true, shouldValidate: true });
    },
    [form],
  );

  return (
    <Section title={t('product.title')} description={t('product.description')}>
      <Field label={t('product.search')} error={typeof itemErrors?.message === 'string' ? itemErrors.message : undefined}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('product.searchPlaceholder')} value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </Field>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {results.length ? (
        <ul className="divide-y rounded-md border">
          {results.map((item) => {
            const added = items.some((selected) => selected.productId === item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => addProduct(item)}
                  disabled={added}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent disabled:opacity-50"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {added ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    {item.variants.length} {t('product.variantCount')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {items.map((item, index) => {
        const product = products[item.productId];
        const errors = itemErrors?.[index];
        const basePrice = basePriceOf(product, item.variantIds, applicablePrice);
        const ratio = basePrice ? Math.round(((basePrice - item.offerPrice) / basePrice) * 100) : null;

        return (
          <div key={item.productId || index} className="flex flex-col gap-5 rounded-lg border p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{product?.name ?? t('product.loading')}</span>
                {product ? (
                  <span className="text-xs text-muted-foreground">
                    {product.variants.length} {t('product.variantCount')}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={t('product.remove')}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {product?.hasOptions ? (
              <Alert>
                <AlertDescription className="text-xs">{t('product.optionSetWarning')}</AlertDescription>
              </Alert>
            ) : null}

            {product ? (
              <Field
                label={t('product.variants')}
                hint={item.variantIds.length ? `${item.variantIds.length} ${t('product.selected')}` : undefined}
                error={errors?.variantIds?.message}
              >
                <ul className="divide-y overflow-hidden rounded-md border">
                  {product.variants.map((variant) => {
                    const selected = item.variantIds.includes(variant.id);
                    return (
                      <li key={variant.id}>
                        <button
                          type="button"
                          onClick={() => toggleVariant(index, variant.id)}
                          disabled={!variant.inStock}
                          aria-pressed={selected}
                          className={cn(
                            'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                            variant.inStock ? 'hover:bg-accent/60' : 'cursor-not-allowed',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                              selected ? 'border-foreground bg-foreground text-background' : 'border-input',
                            )}
                          >
                            {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                          </span>

                          <span className={cn('flex-1 truncate text-xs', !variant.inStock && 'text-muted-foreground line-through')}>
                            {variant.label}
                          </span>

                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {variant.inStock
                              ? formatMoney(
                                  priceBasis(variant, applicablePrice),
                                  { code: product.currencyCode, symbol: product.currencyCode ? undefined : product.currencySymbol },
                                  locale,
                                )
                              : t('product.outOfStock')}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Field>
            ) : null}

            <div className="grid grid-cols-3 gap-4">
              <Field label={t('pricing.offerPrice')} hint={product?.currencySymbol} error={errors?.offerPrice?.message}>
                <Input type="number" step="0.01" min="0" {...form.register(`config.items.${index}.offerPrice`, { valueAsNumber: true })} />
              </Field>
              <Field
                label={t('pricing.discountRatio')}
                hint={basePrice ? `${t('pricing.basePrice')}: ${formatMoney(basePrice, { code: product?.currencyCode, symbol: product?.currencyCode ? undefined : product?.currencySymbol }, locale)}` : undefined}
              >
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="99"
                  disabled={!basePrice}
                  value={ratio ?? ''}
                  onChange={(event) => {
                    if (!basePrice) return;
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    const clamped = Math.min(Math.max(next, 0), 99);
                    form.setValue(`config.items.${index}.offerPrice`, roundMoney(basePrice * (1 - clamped / 100)), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
              </Field>
              <Field label={t('pricing.quantity')} hint={t('pricing.quantityHint')}>
                <Input type="number" step="1" min="1" max="50" {...form.register(`config.items.${index}.quantity`, { valueAsNumber: true })} />
              </Field>
            </div>
          </div>
        );
      })}
    </Section>
  );
}
