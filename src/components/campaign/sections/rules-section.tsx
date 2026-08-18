'use client';

import { Plus } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n';
import type { Rule } from '@/lib/campaigns/rules/types';
import { getCampaignType } from '@/lib/campaigns/registry';
import type { CampaignFormValues } from '../types';
import { RULE_LABEL_KEYS, RuleRow } from './rule-row';
import { Field, Section } from './section';

const BLANK_RULES: Record<Rule['kind'], Rule> = {
  cart_total: { kind: 'cart_total', op: 'gte', amount: 0 },
  cart_contains_product: { kind: 'cart_contains_product', products: [], variantIds: [] },
  page_type: { kind: 'page_type', include: [], products: [], categories: [] },
  visitor: { kind: 'visitor' },
  schedule: { kind: 'schedule' },
};

export function RulesSection({
  form,
  campaignType,
  token,
}: {
  form: UseFormReturn<CampaignFormValues>;
  campaignType: string;
  token: string;
}) {
  const t = useT();
  const rules = form.watch('rules');
  const supported = getCampaignType(campaignType)?.supportedRules ?? [];

  const setConditions = (conditions: Rule[]) => form.setValue('rules', { ...rules, conditions }, { shouldDirty: true });

  return (
    <Section title={t('rules.title')} description={t('rules.description')}>
      <Field label={t('rules.match')}>
        <Select
          value={rules.match}
          onValueChange={(value) => form.setValue('rules', { ...rules, match: value as 'all' | 'any' }, { shouldDirty: true })}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('rules.matchAll')}</SelectItem>
            <SelectItem value="any">{t('rules.matchAny')}</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {rules.conditions.length ? (
        <div className="flex flex-col gap-3">
          {rules.conditions.map((rule, index) => (
            <RuleRow
              key={`${rule.kind}-${index}`}
              rule={rule}
              index={index}
              token={token}
              onChange={(next) => setConditions(rules.conditions.map((item, position) => (position === index ? next : item)))}
              onRemove={() => setConditions(rules.conditions.filter((_, position) => position !== index))}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">{t('rules.empty')}</p>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-fit">
            <Plus className="size-3.5" />
            {t('rules.add')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {supported.map((kind) => (
            <DropdownMenuItem key={kind} onSelect={() => setConditions([...rules.conditions, BLANK_RULES[kind]])}>
              {t(RULE_LABEL_KEYS[kind])}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Section>
  );
}
