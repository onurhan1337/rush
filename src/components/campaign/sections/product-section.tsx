'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiRequests } from '@/lib/api-requests';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ResolvedProduct } from '@/lib/campaigns/product';
import type { CampaignFormValues } from '../types';
import { Field, Section } from './section';

function formatPrice(amount: number, symbol?: string): string {
  return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${symbol ? ` ${symbol}` : ''}`;
}

type Props = {
  form: UseFormReturn<CampaignFormValues>;
  token: string;
  product?: ResolvedProduct;
  onProductChange: (product: ResolvedProduct | undefined) => void;
};

export function ProductSection({ form, token, product, onProductChange }: Props) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResolvedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const variantIds = form.watch('config.variantIds') ?? [];
  const selectedHint = variantIds.length ? `${variantIds.length} ${t('product.selected')}` : undefined;

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

  const selectProduct = useCallback(
    (next: ResolvedProduct) => {
      onProductChange(next);
      form.setValue('config.productId', next.id, { shouldDirty: true });
      const firstInStock = next.variants.find((variant) => variant.inStock && variant.isActive) ?? next.variants[0];
      form.setValue('config.variantIds', firstInStock ? [firstInStock.id] : [], { shouldDirty: true });
      if (firstInStock) {
        form.setValue('config.offerPrice', Math.max(0, Math.round(firstInStock.sellPrice * 0.8 * 100) / 100), { shouldDirty: true });
      }
      setQuery('');
      setResults([]);
    },
    [form, onProductChange],
  );

  const clearProduct = useCallback(() => {
    onProductChange(undefined);
    form.setValue('config.productId', '', { shouldDirty: true });
    form.setValue('config.variantIds', [], { shouldDirty: true });
  }, [form, onProductChange]);

  const toggleVariant = useCallback(
    (variantId: string) => {
      const current = form.getValues('config.variantIds') ?? [];
      const next = current.includes(variantId) ? current.filter((id) => id !== variantId) : [...current, variantId];
      form.setValue('config.variantIds', next, { shouldDirty: true, shouldValidate: true });
    },
    [form],
  );

  return (
    <Section title={t('product.title')} description={t('product.description')}>
      <Field label={t('product.search')} error={form.formState.errors.config?.productId?.message}>
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
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => selectProduct(item)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent"
              >
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.variants.length} {t('product.variantCount')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {product ? (
        <div className="flex flex-col gap-5 rounded-lg border p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{product.name}</span>
              <span className="text-xs text-muted-foreground">
                {product.variants.length} {t('product.variantCount')}
              </span>
            </div>
            <button type="button" onClick={() => clearProduct()} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
              {t('product.change')}
            </button>
          </div>

          {product.hasOptions ? (
            <Alert>
              <AlertDescription className="text-xs">{t('product.optionSetWarning')}</AlertDescription>
            </Alert>
          ) : null}

          <Field label={t('product.variants')} hint={selectedHint} error={form.formState.errors.config?.variantIds?.message}>
            <ul className="divide-y overflow-hidden rounded-md border">
              {product.variants.map((variant) => {
                const selected = variantIds.includes(variant.id);
                return (
                  <li key={variant.id}>
                    <button
                      type="button"
                      onClick={() => toggleVariant(variant.id)}
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
                        {variant.inStock ? formatPrice(variant.sellPrice, product.currencySymbol) : t('product.outOfStock')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Field>
        </div>
      ) : null}
    </Section>
  );
}
