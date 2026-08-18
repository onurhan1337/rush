export type RuleKind = 'cart_total' | 'cart_contains_product' | 'page_type' | 'visitor' | 'schedule';

export type PageType = 'home' | 'product' | 'collection' | 'cart' | 'other';

export type EntityRef = {
  id: string;
  name: string;
  slug: string;
};

export type CartTotalRule = {
  kind: 'cart_total';
  op: 'gte' | 'lte';
  amount: number;
};

export type CartContainsProductRule = {
  kind: 'cart_contains_product';
  products: EntityRef[];
  variantIds: string[];
};

export type PageTypeRule = {
  kind: 'page_type';
  include: PageType[];
  products: EntityRef[];
  categories: EntityRef[];
};

export type VisitorRule = {
  kind: 'visitor';
  isLoggedIn?: boolean;
  isFirstVisit?: boolean;
};

export type ScheduleRule = {
  kind: 'schedule';
  startsAt?: string;
  endsAt?: string;
  daysOfWeek?: number[];
  hours?: { from: number; to: number };
};

export type Rule = CartTotalRule | CartContainsProductRule | PageTypeRule | VisitorRule | ScheduleRule;

export type RuleSet = {
  match: 'all' | 'any';
  conditions: Rule[];
};

export type CartLine = {
  productId?: string;
  variantId?: string;
  quantity: number;
  price: number;
};

export type CartSnapshot = {
  total: number;
  lines: CartLine[];
};

export type RuleContext = {
  cart?: CartSnapshot;
  pageType: PageType;
  path: string;
  isLoggedIn: boolean;
  isFirstVisit: boolean;
  now: number;
};

export const EMPTY_RULE_SET: RuleSet = { match: 'all', conditions: [] };
