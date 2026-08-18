import { z } from 'zod';
import type { RuleSet } from './types';

const MAX_REFS = 50;

export const entityRefSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().max(200).default(''),
  slug: z.string().max(200).default(''),
});

const entityRefListSchema = z.array(entityRefSchema).max(MAX_REFS).default([]);

export const cartTotalRuleSchema = z.object({
  kind: z.literal('cart_total'),
  op: z.enum(['gte', 'lte']),
  amount: z.number().min(0),
});

export const cartContainsProductRuleSchema = z.object({
  kind: z.literal('cart_contains_product'),
  products: entityRefListSchema,
  variantIds: z.array(z.string().min(1).max(64)).max(MAX_REFS).default([]),
});

export const pageTypeRuleSchema = z.object({
  kind: z.literal('page_type'),
  include: z.array(z.enum(['home', 'product', 'collection', 'cart', 'other'])).default([]),
  products: entityRefListSchema,
  categories: entityRefListSchema,
});

export const visitorRuleSchema = z.object({
  kind: z.literal('visitor'),
  isLoggedIn: z.boolean().optional(),
  isFirstVisit: z.boolean().optional(),
});

export const scheduleRuleSchema = z.object({
  kind: z.literal('schedule'),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  hours: z.object({ from: z.number().min(0).max(23), to: z.number().min(0).max(23) }).optional(),
});

function migrateLegacyRule(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;

  const rule = value as Record<string, unknown>;
  if (rule.kind !== 'cart_contains_product' || rule.products !== undefined) return value;

  const legacyIds = Array.isArray(rule.productIds) ? rule.productIds : [];
  const products = legacyIds
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .slice(0, MAX_REFS)
    .map((id) => ({ id, name: '', slug: '' }));

  return { ...rule, products };
}

export const ruleSchema = z.preprocess(
  migrateLegacyRule,
  z.discriminatedUnion('kind', [
    cartTotalRuleSchema,
    cartContainsProductRuleSchema,
    pageTypeRuleSchema,
    visitorRuleSchema,
    scheduleRuleSchema,
  ]),
);

export const ruleSetSchema = z.object({
  match: z.enum(['all', 'any']).default('all'),
  conditions: z.array(ruleSchema).max(20).default([]),
});

export type ParsedRuleSet = z.infer<typeof ruleSetSchema>;

const _typeCheck: RuleSet = {} as ParsedRuleSet;
void _typeCheck;
