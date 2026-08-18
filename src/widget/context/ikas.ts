import type { CartSnapshot, PageType } from '@/lib/campaigns/rules/types';

type IkasEventPayload = {
  cart?: {
    totalFinalPrice?: number;
    totalPrice?: number;
    items?: Array<{ id?: string; quantity?: number; price?: number; variant?: { id?: string; productId?: string } }>;
  };
};

type AddToCartResult = { success?: boolean; validationError?: string } | undefined;

type IkasWindow = Window & {
  IkasEvents?: { subscribe: (options: { id: string; callback: (event: { type: string; data?: IkasEventPayload }) => void }) => void };
  addToCart?: (options: { variantId: string; quantity: number; itemId?: string }) => Promise<AddToCartResult> | AddToCartResult;
};

const CART_EVENTS = ['ADD_TO_CART', 'REMOVE_FROM_CART', 'VIEW_CART', 'UPDATE_CART'];
const SF_GRAPHQL = 'https://api.myikas.com/api/sf/graphql';
const ADD_TO_CART_TIMEOUT_MS = 8000;
const ADD_TO_CART_WAIT_MS = 5000;
const CART_QUERY =
  'query getCartById($cartId: String!) { getCartById(cartId: $cartId) { totalFinalPrice totalPrice items { id quantity price variant { id productId } } } }';

let cart: CartSnapshot | undefined;
let cartResolved = false;
const listeners: Array<(cart: CartSnapshot | undefined) => void> = [];

function ikasWindow(): IkasWindow {
  return window as IkasWindow;
}

function publish() {
  for (let i = 0; i < listeners.length; i++) listeners[i](cart);
}

function snapshotFromPayload(payload: IkasEventPayload | undefined): CartSnapshot | undefined {
  const raw = payload?.cart;
  if (!raw) return undefined;
  const items = raw.items ?? [];
  return {
    total: raw.totalFinalPrice ?? raw.totalPrice ?? 0,
    lines: items.map((item) => ({
      productId: item.variant?.productId,
      variantId: item.variant?.id,
      quantity: item.quantity ?? 1,
      price: item.price ?? 0,
    })),
  };
}

export function onCartChange(listener: (cart: CartSnapshot | undefined) => void): void {
  listeners.push(listener);
}

export function getCart(): CartSnapshot | undefined {
  return cart;
}

export function isCartResolved(): boolean {
  return cartResolved;
}

export function setCart(next: CartSnapshot | undefined): void {
  cart = next;
  cartResolved = true;
  publish();
}

const SUBSCRIBE_RETRY_MS = 500;
const SUBSCRIBE_TIMEOUT_MS = 8000;

let subscribed = false;

export function subscribeCart(startedAt = Date.now()): void {
  if (subscribed) return;

  try {
    const events = ikasWindow().IkasEvents;
    if (!events || typeof events.subscribe !== 'function') {
      if (Date.now() - startedAt < SUBSCRIBE_TIMEOUT_MS) setTimeout(() => subscribeCart(startedAt), SUBSCRIBE_RETRY_MS);
      return;
    }

    subscribed = true;
    events.subscribe({
      id: 'rush',
      callback: (event) => {
        if (CART_EVENTS.indexOf(event.type) === -1) return;
        const snapshot = snapshotFromPayload(event.data);
        if (snapshot) setCart(snapshot);
      },
    });
  } catch {
    return;
  }
}

async function fetchCart(): Promise<CartSnapshot | undefined> {
  const cartId = localStorage.getItem('cartId');
  if (!cartId) return { total: 0, lines: [] };

  const response = await fetch(SF_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CART_QUERY, variables: { cartId } }),
  });

  if (!response.ok) return undefined;

  const body = await response.json();
  return snapshotFromPayload({ cart: body?.data?.getCartById });
}

export async function hydrateCart(): Promise<CartSnapshot | undefined> {
  try {
    const snapshot = await fetchCart();
    setCart(snapshot ?? { total: 0, lines: [] });
    return getCart();
  } catch {
    setCart(undefined);
    return undefined;
  }
}

export function cartContainsVariant(snapshot: CartSnapshot | undefined, variantId: string): boolean {
  if (!snapshot) return false;
  for (let i = 0; i < snapshot.lines.length; i++) {
    if (snapshot.lines[i].variantId === variantId) return true;
  }
  return false;
}

function waitForAddToCart(timeoutMs: number): Promise<IkasWindow['addToCart'] | undefined> {
  return new Promise((resolve) => {
    const started = Date.now();
    const poll = () => {
      const fn = ikasWindow().addToCart;
      if (typeof fn === 'function') return resolve(fn);
      if (Date.now() - started >= timeoutMs) return resolve(undefined);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, timeoutMs);

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

export type AddToCartOutcome = { success: boolean; error?: string; unavailable?: boolean; timedOut?: boolean };

const TIMED_OUT: AddToCartOutcome = { success: false, timedOut: true };

export async function addToCart(variantId: string, quantity: number): Promise<AddToCartOutcome> {
  const fn = await waitForAddToCart(ADD_TO_CART_WAIT_MS);
  if (!fn) return { success: false, unavailable: true };

  let outcome: AddToCartOutcome;
  try {
    const call = Promise.resolve(fn({ variantId, quantity }));
    const result = await withTimeout(call, ADD_TO_CART_TIMEOUT_MS, undefined);
    if (result === undefined) outcome = TIMED_OUT;
    else if (result.success) outcome = { success: true };
    else outcome = { success: false, error: result.validationError };
  } catch {
    outcome = { success: false, unavailable: true };
  }

  if (outcome.success) return outcome;

  const verified = await withTimeout(hydrateCart(), ADD_TO_CART_TIMEOUT_MS, undefined);
  if (cartContainsVariant(verified, variantId)) return { success: true };

  return outcome;
}

const LD_JSON = 'script[type="application/ld+json"]';
const COLLECTION_LD = /"@type"\s*:\s*"CollectionPage"/;
const PRODUCT_LD = /"@type"\s*:\s*"Product"/;

function structuredPageType(): PageType | undefined {
  try {
    const scripts = document.querySelectorAll(LD_JSON);
    let hasProduct = false;

    for (let i = 0; i < scripts.length; i++) {
      const text = scripts[i].textContent || '';
      if (COLLECTION_LD.test(text)) return 'collection';
      if (PRODUCT_LD.test(text)) hasProduct = true;
    }

    return hasProduct ? 'product' : undefined;
  } catch {
    return undefined;
  }
}

export function getPageType(): PageType {
  const path = location.pathname.toLowerCase();
  if (path === '/' || path === '') return 'home';
  if (/\/(cart|sepet|sepetim)\b/.test(path)) return 'cart';

  const structured = structuredPageType();
  if (structured) return structured;

  if (/\/(product|urun|ürün|p)\//.test(path)) return 'product';
  if (/\/(collection|category|kategori|koleksiyon)\b/.test(path)) return 'collection';
  return 'other';
}

export function getPath(): string {
  return location.pathname.toLowerCase();
}

export function isLoggedIn(): boolean {
  try {
    return !!localStorage.getItem('customerToken') || document.cookie.indexOf('customerId') !== -1;
  } catch {
    return false;
  }
}
