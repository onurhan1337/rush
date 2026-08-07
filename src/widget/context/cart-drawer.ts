type Invokable = (...args: unknown[]) => unknown;

const NATIVE_PATHS = [
  ['ikas', 'cart', 'open'],
  ['ikas', 'openCart'],
  ['ikas', 'ui', 'openCart'],
  ['ikasStore', 'openCart'],
  ['openCartDrawer'],
  ['openCart'],
  ['showCart'],
  ['toggleCart'],
];

const OPEN_EVENTS = ['ikas:cart:open', 'ikas-cart-open', 'ikasOpenCart', 'cart:open', 'cart-drawer:open', 'openCartDrawer'];

const TRIGGER_SELECTORS = [
  '[data-testid*="cart" i][data-testid*="button" i]',
  '[data-testid="cart-icon"]',
  '[data-cart-toggle]',
  '[data-drawer="cart"]',
  'button[aria-label*="sepet" i]',
  'button[aria-label*="cart" i]',
  '[role="button"][aria-label*="sepet" i]',
  '[role="button"][aria-label*="cart" i]',
  'button[class*="cart" i]',
  'button[id*="cart" i]',
  '[class*="cart-button" i]',
  '[class*="CartButton"]',
  '[class*="cart-icon" i]',
  '[class*="basket" i][role="button"]',
];

const CART_PATHS = ['/sepet', '/cart', '/sepetim'];

function resolveNative(path: string[]): Invokable | undefined {
  let node: unknown = window;
  for (const key of path) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === 'function' ? (node as Invokable) : undefined;
}

function callNative(): boolean {
  for (const path of NATIVE_PATHS) {
    const fn = resolveNative(path);
    if (!fn) continue;
    try {
      fn();
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

function isVisible(element: Element): boolean {
  if (!element.getClientRects().length) return false;
  const style = getComputedStyle(element);
  return style.visibility !== 'hidden' && style.pointerEvents !== 'none';
}

function isNavigation(element: Element): boolean {
  const anchor = element.closest('a');
  if (!anchor) return false;
  const href = anchor.getAttribute('href') ?? '';
  return href.length > 0 && href !== '#' && !href.startsWith('javascript:');
}

function findTrigger(selectors: string[], allowNavigation = false): HTMLElement | undefined {
  for (const selector of selectors) {
    let candidates: NodeListOf<Element>;
    try {
      candidates = document.querySelectorAll(selector);
    } catch {
      continue;
    }

    for (const candidate of Array.from(candidates)) {
      if (!(candidate instanceof HTMLElement)) continue;
      if (candidate.closest('[data-rush]')) continue;
      if (!isVisible(candidate)) continue;
      if (!allowNavigation && isNavigation(candidate)) continue;
      return candidate;
    }
  }
  return undefined;
}

function dispatchOpenEvents(): void {
  for (const type of OPEN_EVENTS) {
    const detail = { source: 'rush' };
    window.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
    document.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
  }
}

export function openCartDrawer(customSelector?: string): boolean {
  try {
    if (customSelector) {
      const pinned = findTrigger([customSelector], true);
      if (pinned) {
        pinned.click();
        return true;
      }
    }

    if (callNative()) return true;

    const trigger = findTrigger(TRIGGER_SELECTORS);
    if (trigger) {
      trigger.click();
      return true;
    }

    dispatchOpenEvents();
    return false;
  } catch {
    return false;
  }
}

export function cartUrl(): string {
  const anchor = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).find((link) => {
    const path = link.getAttribute('href') ?? '';
    return CART_PATHS.some((candidate) => path === candidate || path.endsWith(candidate));
  });

  return anchor?.getAttribute('href') ?? CART_PATHS[0];
}

export function goToCart(): void {
  window.location.href = cartUrl();
}
