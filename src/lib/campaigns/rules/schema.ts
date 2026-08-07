import { z } from 'zod';
import type { RuleSet } from './types';

export const cartTotalRuleSchema = z.object({
  kind: z.literal('cart_total'),
  op: z.enum(['gte', 'lte']),
  amount: z.number().min(0),
});

export const cartContainsProductRuleSchema = z.object({
  kind: z.literal('cart_contains_product'),
  productIds: z.array(z.string()).default([]),
  variantIds: z.array(z.string()).default([]),
});

export const pageTypeRuleSchema = z.object({
  kind: z.literal('page_type'),
  include: z.array(z.enum(['home', 'product', 'collection', 'cart', 'other'])).default([]),
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

export const ruleSchema = z.discriminatedUnion('kind', [
  cartTotalRuleSchema,
  cartContainsProductRuleSchema,
  pageTypeRuleSchema,
  visitorRuleSchema,
  scheduleRuleSchema,
]);

export const ruleSetSchema = z.object({
  match: z.enum(['all', 'any']).default('all'),
  conditions: z.array(ruleSchema).default([]),
});

export type ParsedRuleSet = z.infer<typeof ruleSetSchema>;

const _typeCheck: RuleSet = {} as ParsedRuleSet;
void _typeCheck;
