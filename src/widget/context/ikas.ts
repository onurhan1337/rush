import type { CartSnapshot, PageType } from '@/lib/campaigns/rules/types';

type IkasEventPayload = {
  cart?: {
    totalFinalPrice?: number;
    totalPrice?: number;
    items?: Array<{ id?: string; quantity?: number; price?: number; variant?: { id?: string; productId?: string } }>;
  };
};

type IkasWindow = Window & {
  IkasEvents?: { subscribe: (options: { id: string; callback: (event: { type: string; data?: IkasEventPayload }) => void }) => void };
  addToCart?: (options: { variantId: string; quantity: number; itemId?: string }) => Promise<{ success: boolean; validationError?: string }>;
};

const CART_EVENTS = ['ADD_TO_CART', 'REMOVE_FROM_CART', 'VIEW_CART', 'UPDATE_CART'];
const SF_GRAPHQL = 'https://api.myikas.com/api/sf/graphql';

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

export function subscribeCart(): void {
  try {
    const events = ikasWindow().IkasEvents;
    if (!events || typeof events.subscribe !== 'function') return;
    events.subscribe({
      id: 'rush',
      callback: (event) => {
        if (CART_EVENTS.indexOf(event.type) === -1) return;
        const snapshot = snapshotFromPayload(event.data);
        if (snapshot) setCart(snapshot);
      },
    });
  } catch {
    // storefront without IkasEvents — cart stays unresolved
  }
}

export async function hydrateCart(): Promise<void> {
  try {
    const cartId = localStorage.getItem('cartId');
    if (!cartId) {
      setCart({ total: 0, lines: [] });
      return;
    }

    const response = await fetch(SF_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'query getCartById($cartId: String!) { getCartById(cartId: $cartId) { totalFinalPrice totalPrice items { id quantity price variant { id productId } } } }',
        variables: { cartId },
      }),
    });

    const body = await response.json();
    const snapshot = snapshotFromPayload({ cart: body?.data?.getCartById });
    setCart(snapshot ?? { total: 0, lines: [] });
  } catch {
    setCart(undefined);
    cartResolved = true;
  }
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

export async function addToCart(variantId: string, quantity: number): Promise<{ success: boolean; error?: string; unavailable?: boolean }> {
  const fn = await waitForAddToCart(5000);
  if (!fn) return { success: false, unavailable: true };

  try {
    const result = await fn({ variantId, quantity });
    if (result && result.success) return { success: true };
    return { success: false, error: result?.validationError };
  } catch {
    return { success: false, unavailable: true };
  }
}

export function getPageType(): PageType {
  const path = location.pathname.toLowerCase();
  if (path === '/' || path === '') return 'home';
  if (/\/(cart|sepet|sepetim)\b/.test(path)) return 'cart';
  if (/\/(product|urun|ürün|p)\//.test(path)) return 'product';
  if (/\/(collection|category|kategori|koleksiyon)\b/.test(path)) return 'collection';
  return 'other';
}

export function isLoggedIn(): boolean {
  try {
    return !!localStorage.getItem('customerToken') || document.cookie.indexOf('customerId') !== -1;
  } catch {
    return false;
  }
}
