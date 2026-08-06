'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { PageType, Rule } from '@/lib/campaigns/rules/types';
import { cn } from '@/lib/utils';

export const RULE_LABEL_KEYS: Record<Rule['kind'], TranslationKey> = {
  cart_total: 'rules.cart_total',
  cart_contains_product: 'rules.cart_contains_product',
  page_type: 'rules.page_type',
  visitor: 'rules.visitor',
  schedule: 'rules.schedule',
};

const PAGE_TYPES: Array<{ value: PageType; label: TranslationKey }> = [
  { value: 'home', label: 'page.home' },
  { value: 'product', label: 'page.product' },
  { value: 'collection', label: 'page.collection' },
  { value: 'cart', label: 'page.cart' },
  { value: 'other', label: 'page.other' },
];

type Props = {
  rule: Rule;
  index: number;
  onChange: (rule: Rule) => void;
  onRemove: () => void;
};

export function RuleRow({ rule, index, onChange, onRemove }: Props) {
  const t = useT();

  return (
    <div className="flex items-start gap-3 rounded-md border p-4">
      <div className="flex flex-1 flex-col gap-3">
        <span className="text-xs font-medium">{t(RULE_LABEL_KEYS[rule.kind])}</span>

        {rule.kind === 'cart_total' ? (
          <div className="flex gap-2">
            <Select value={rule.op} onValueChange={(value) => onChange({ ...rule, op: value as 'gte' | 'lte' })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gte">{t('rules.opGte')}</SelectItem>
                <SelectItem value="lte">{t('rules.opLte')}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={rule.amount}
              onChange={(event) => onChange({ ...rule, amount: Number(event.target.value) || 0 })}
            />
          </div>
        ) : null}

        {rule.kind === 'cart_contains_product' ? (
          <Input
            placeholder={t('rules.productIdsPlaceholder')}
            value={rule.productIds.join(', ')}
            onChange={(event) =>
              onChange({
                ...rule,
                productIds: event.target.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean),
              })
            }
          />
        ) : null}

        {rule.kind === 'page_type' ? (
          <div className="flex flex-wrap gap-2">
            {PAGE_TYPES.map((pageType) => {
              const selected = rule.include.includes(pageType.value);
              return (
                <button
                  key={pageType.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...rule,
                      include: selected ? rule.include.filter((value) => value !== pageType.value) : [...rule.include, pageType.value],
                    })
                  }
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    selected ? 'border-foreground bg-foreground text-background' : 'hover:bg-accent',
                  )}
                >
                  {t(pageType.label)}
                </button>
              );
            })}
          </div>
        ) : null}

        {rule.kind === 'visitor' ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={`visitor-login-${index}`} className="text-xs font-normal">
                {t('rules.onlyLoggedIn')}
              </Label>
              <Switch
                id={`visitor-login-${index}`}
                checked={rule.isLoggedIn === true}
                onCheckedChange={(checked) => onChange({ ...rule, isLoggedIn: checked ? true : undefined })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={`visitor-first-${index}`} className="text-xs font-normal">
                {t('rules.onlyFirstVisit')}
              </Label>
              <Switch
                id={`visitor-first-${index}`}
                checked={rule.isFirstVisit === true}
                onCheckedChange={(checked) => onChange({ ...rule, isFirstVisit: checked ? true : undefined })}
              />
            </div>
          </div>
        ) : null}

        {rule.kind === 'schedule' ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="datetime-local"
              value={rule.startsAt?.slice(0, 16) ?? ''}
              onChange={(event) => onChange({ ...rule, startsAt: event.target.value ? new Date(event.target.value).toISOString() : undefined })}
            />
            <Input
              type="datetime-local"
              value={rule.endsAt?.slice(0, 16) ?? ''}
              onChange={(event) => onChange({ ...rule, endsAt: event.target.value ? new Date(event.target.value).toISOString() : undefined })}
            />
          </div>
        ) : null}
      </div>

      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={t('rules.removeAria')}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
