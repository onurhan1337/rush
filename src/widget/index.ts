import { evaluateRules, requiresCart } from '@/lib/campaigns/rules/evaluate';
import type { CartSnapshot, PageType, RuleContext } from '@/lib/campaigns/rules/types';
import type { WidgetCampaign, WidgetConfigPayload } from '@/lib/campaigns/widget-types';
import { getCart, getPageType, getPath, hydrateCart, isCartResolved, isLoggedIn, onCartChange, setCart, subscribeCart } from './context/ikas';
import { fetchConfig, listenForPreviewConfig } from './transport/config';
import { initEvents } from './transport/events';
import { getRenderer } from './render/registry';
import type { RenderedCampaign } from './render/offer-product';

const FIRST_VISIT_KEY = 'rush.seen';

type PreviewContext = {
  cart?: CartSnapshot;
  pageType?: PageType;
  path?: string;
  isLoggedIn?: boolean;
  isFirstVisit?: boolean;
};

let previewContext: PreviewContext = {};
let previewMode = false;
const rendered = new Map<string, RenderedCampaign>();
let campaigns: WidgetCampaign[] = [];

function isFirstVisit(): boolean {
  try {
    if (localStorage.getItem(FIRST_VISIT_KEY)) return false;
    localStorage.setItem(FIRST_VISIT_KEY, '1');
    return true;
  } catch {
    return true;
  }
}

const firstVisit = isFirstVisit();

function buildContext(): RuleContext {
  return {
    cart: previewMode ? previewContext.cart : getCart(),
    pageType: previewContext.pageType ?? getPageType(),
    path: previewMode ? (previewContext.path ?? '') : getPath(),
    isLoggedIn: previewContext.isLoggedIn ?? isLoggedIn(),
    isFirstVisit: previewContext.isFirstVisit ?? firstVisit,
    now: Date.now(),
  };
}

function reconcile(): void {
  const context = buildContext();

  for (let i = 0; i < campaigns.length; i++) {
    const campaign = campaigns[i];
    const needsCart = requiresCart(campaign.rules);

    // A cart-dependent rule stays unsatisfied until the cart is known: never show a
    // discount we cannot yet justify.
    const cartKnown = previewMode || isCartResolved();
    const matches = needsCart && !cartKnown ? false : evaluateRules(campaign.rules, context);

    const existing = rendered.get(campaign.id);

    if (matches && !existing) {
      const renderer = getRenderer(campaign.type);
      if (!renderer) continue;
      const instance = renderer(campaign);
      if (instance) rendered.set(campaign.id, instance);
    } else if (!matches && existing) {
      existing.destroy();
      rendered.delete(campaign.id);
    }
  }
}

function applyPayload(payload: WidgetConfigPayload, publicKey: string): void {
  for (const [, instance] of rendered) instance.destroy();
  rendered.clear();

  campaigns = payload.campaigns ?? [];
  if (payload.eventsUrl && !previewMode) initEvents(payload.eventsUrl, publicKey);
  reconcile();
}

function scheduleIdle(callback: () => void): void {
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(callback, { timeout: 2000 });
  else setTimeout(callback, 1);
}

function boot(): void {
  const script = document.currentScript as HTMLScriptElement | null;
  const publicKey = script?.getAttribute('data-rush-key') ?? '';
  const preview = script?.getAttribute('data-rush-preview') === '1';

  // Subscribe synchronously at parse time — the IkasEvents stub is ready before hydration.
  subscribeCart();

  if (preview) {
    previewMode = true;
    setCart({ total: 0, lines: [] });
    listenForPreviewConfig((message) => {
      const withContext = message as WidgetConfigPayload & { context?: PreviewContext };
      if (withContext.context) previewContext = withContext.context;
      applyPayload(message, publicKey);
    });
    return;
  }

  if (!publicKey) return;

  const origin = script?.src ? new URL(script.src).origin : location.origin;

  scheduleIdle(() => {
    onCartChange(() => reconcile());
    void hydrateCart();

    fetchConfig(origin, publicKey)
      .then((payload) => applyPayload(payload, publicKey))
      .catch(() => {
        // config unavailable — the storefront is unaffected
      });
  });
}

boot();
