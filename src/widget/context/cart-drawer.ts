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

const CART_SEGMENTS = ['cart', 'sepet', 'sepetim', 'basket'];
const DEFAULT_CART_PATH = '/cart';
const LOCALE_SEGMENT = /^[a-z]{2}(-[a-z]{2})?$/i;

const DRAWER_SELECTORS = [
  '[data-testid*="cart-drawer" i]',
  '[data-cart-drawer]',
  '[class*="cart-drawer" i]',
  '[class*="CartDrawer"]',
  '[class*="cart-modal" i]',
  '[class*="drawer" i][class*="cart" i]',
  '[id*="cart-drawer" i]',
  'aside[class*="cart" i]',
  '[role="dialog"][aria-label*="sepet" i]',
  '[role="dialog"][aria-label*="cart" i]',
];

const DRAWER_POLL_INTERVAL_MS = 300;
const DRAWER_POLL_ATTEMPTS = 8;
const MIN_DRAWER_SIZE_PX = 240;

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
  if (style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
  return style.opacity !== '0';
}

function isOnScreen(element: Element): boolean {
  const box = element.getBoundingClientRect();
  if (box.width < MIN_DRAWER_SIZE_PX || box.height < MIN_DRAWER_SIZE_PX) return false;
  return box.right > 0 && box.left < window.innerWidth && box.bottom > 0 && box.top < window.innerHeight;
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

export function isCartDrawerOpen(): boolean {
  for (const selector of DRAWER_SELECTORS) {
    let candidates: NodeListOf<Element>;
    try {
      candidates = document.querySelectorAll(selector);
    } catch {
      continue;
    }

    for (const candidate of Array.from(candidates)) {
      if (!(candidate instanceof HTMLElement)) continue;
      if (candidate.closest('[data-rush]')) continue;
      if (candidate.getAttribute('aria-hidden') === 'true') continue;
      if (!isVisible(candidate)) continue;
      if (!isOnScreen(candidate)) continue;
      return true;
    }
  }
  return false;
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

function isCartPath(pathname: string): boolean {
  const segments = pathname.toLowerCase().split('/').filter(Boolean);
  if (!segments.length) return false;
  return CART_SEGMENTS.indexOf(segments[segments.length - 1]) !== -1;
}

function fallbackCartPath(): string {
  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length > 1 && LOCALE_SEGMENT.test(segments[0])) return `/${segments[0]}${DEFAULT_CART_PATH}`;
  return DEFAULT_CART_PATH;
}

export function cartUrl(): string {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));

  for (const anchor of anchors) {
    if (anchor.closest('[data-rush]')) continue;
    const raw = anchor.getAttribute('href') ?? '';
    if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) continue;

    let url: URL;
    try {
      url = new URL(raw, location.href);
    } catch {
      continue;
    }

    if (url.origin !== location.origin) continue;
    if (!isCartPath(url.pathname)) continue;
    return `${url.pathname}${url.search}`;
  }

  return fallbackCartPath();
}

export function goToCart(): void {
  window.location.href = cartUrl();
}

function pollDrawer(attempt: number, onUnconfirmed: () => void): void {
  setTimeout(() => {
    if (isCartDrawerOpen()) return;
    if (attempt + 1 >= DRAWER_POLL_ATTEMPTS) {
      onUnconfirmed();
      return;
    }
    pollDrawer(attempt + 1, onUnconfirmed);
  }, DRAWER_POLL_INTERVAL_MS);
}

export function openCartDrawerWithFallback(customSelector: string | undefined, onUnconfirmed: () => void): void {
  openCartDrawer(customSelector);
  pollDrawer(0, onUnconfirmed);
}
