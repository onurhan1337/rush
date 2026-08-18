import type { EntityRef, PageType, Rule, RuleContext, RuleSet } from './types';

function evaluateCartTotal(rule: Extract<Rule, { kind: 'cart_total' }>, context: RuleContext): boolean {
  if (!context.cart) return false;
  return rule.op === 'gte' ? context.cart.total >= rule.amount : context.cart.total <= rule.amount;
}

function evaluateCartContainsProduct(rule: Extract<Rule, { kind: 'cart_contains_product' }>, context: RuleContext): boolean {
  if (!context.cart) return false;
  if (!rule.products.length && !rule.variantIds.length) return true;

  for (let i = 0; i < context.cart.lines.length; i++) {
    const line = context.cart.lines[i];
    if (line.productId && rule.products.some((product) => product.id === line.productId)) return true;
    if (line.variantId && rule.variantIds.indexOf(line.variantId) !== -1) return true;
  }
  return false;
}

function normalizeSlug(slug: string): string {
  return slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function pathMatchesSlug(path: string, slug: string): boolean {
  const normalized = normalizeSlug(slug);
  if (!normalized) return false;

  const segments = path.toLowerCase().split('/').filter(Boolean);
  if (normalized.indexOf('/') === -1) return segments.indexOf(normalized) !== -1;
  return `/${segments.join('/')}`.endsWith(`/${normalized}`);
}

function matchesAnyRef(refs: EntityRef[], path: string): boolean {
  for (let i = 0; i < refs.length; i++) {
    if (pathMatchesSlug(path, refs[i].slug)) return true;
  }
  return false;
}

// Landing on the exact URL of a picked product or category is itself proof of the page
// type, so a theme the storefront detection cannot read does not silently disable the
// rule.
function scopedPageType(rule: Extract<Rule, { kind: 'page_type' }>, context: RuleContext): PageType {
  if (context.path) {
    if (rule.products.length && matchesAnyRef(rule.products, context.path)) return 'product';
    if (rule.categories.length && matchesAnyRef(rule.categories, context.path)) return 'collection';
  }
  return context.pageType;
}

function evaluatePageType(rule: Extract<Rule, { kind: 'page_type' }>, context: RuleContext): boolean {
  const pageType = scopedPageType(rule, context);
  if (rule.include.length && rule.include.indexOf(pageType) === -1) return false;

  // Without a storefront path — preview, for instance — the narrower product and
  // category scopes cannot be resolved, so the page type decides on its own.
  if (!context.path) return true;

  if (pageType === 'product' && rule.products.length) return matchesAnyRef(rule.products, context.path);
  if (pageType === 'collection' && rule.categories.length) return matchesAnyRef(rule.categories, context.path);
  return true;
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
      return evaluatePageType(rule, context);
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
