import type { Rule, RuleContext, RuleSet } from './types';

function evaluateCartTotal(rule: Extract<Rule, { kind: 'cart_total' }>, context: RuleContext): boolean {
  if (!context.cart) return false;
  return rule.op === 'gte' ? context.cart.total >= rule.amount : context.cart.total <= rule.amount;
}

function evaluateCartContainsProduct(rule: Extract<Rule, { kind: 'cart_contains_product' }>, context: RuleContext): boolean {
  if (!context.cart) return false;
  if (!rule.productIds.length && !rule.variantIds.length) return true;
  for (let i = 0; i < context.cart.lines.length; i++) {
    const line = context.cart.lines[i];
    if (line.productId && rule.productIds.indexOf(line.productId) !== -1) return true;
    if (line.variantId && rule.variantIds.indexOf(line.variantId) !== -1) return true;
  }
  return false;
}

function evaluateSchedule(rule: Extract<Rule, { kind: 'schedule' }>, context: RuleContext): boolean {
  const now = new Date(context.now);
  if (rule.startsAt && context.now < Date.parse(rule.startsAt)) return false;
  if (rule.endsAt && context.now > Date.parse(rule.endsAt)) return false;
  if (rule.daysOfWeek && rule.daysOfWeek.length && rule.daysOfWeek.indexOf(now.getDay()) === -1) return false;
  if (rule.hours) {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const from = rule.hours.from * 60;
    const to = rule.hours.to * 60;
    if (from <= to) {
      if (minutes < from || minutes > to) return false;
    } else if (minutes < from && minutes > to) {
      return false;
    }
  }
  return true;
}

export function evaluateRule(rule: Rule, context: RuleContext): boolean {
  switch (rule.kind) {
    case 'cart_total':
      return evaluateCartTotal(rule, context);
    case 'cart_contains_product':
      return evaluateCartContainsProduct(rule, context);
    case 'page_type':
      return !rule.include.length || rule.include.indexOf(context.pageType) !== -1;
    case 'visitor':
      if (typeof rule.isLoggedIn === 'boolean' && rule.isLoggedIn !== context.isLoggedIn) return false;
      if (typeof rule.isFirstVisit === 'boolean' && rule.isFirstVisit !== context.isFirstVisit) return false;
      return true;
    case 'schedule':
      return evaluateSchedule(rule, context);
    default:
      return true;
  }
}

export function evaluateRules(ruleSet: RuleSet | undefined | null, context: RuleContext): boolean {
  if (!ruleSet || !ruleSet.conditions || !ruleSet.conditions.length) return true;
  if (ruleSet.match === 'any') {
    for (let i = 0; i < ruleSet.conditions.length; i++) {
      if (evaluateRule(ruleSet.conditions[i], context)) return true;
    }
    return false;
  }
  for (let i = 0; i < ruleSet.conditions.length; i++) {
    if (!evaluateRule(ruleSet.conditions[i], context)) return false;
  }
  return true;
}

export function requiresCart(ruleSet: RuleSet | undefined | null): boolean {
  if (!ruleSet || !ruleSet.conditions) return false;
  for (let i = 0; i < ruleSet.conditions.length; i++) {
    const kind = ruleSet.conditions[i].kind;
    if (kind === 'cart_total' || kind === 'cart_contains_product') return true;
  }
  return false;
}
