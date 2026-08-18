import type { AfterConversion } from '@/lib/campaigns/types/offer-product/schema';
import type { AddToCartOutcome } from '../context/ikas';
import type { WidgetCampaign, WidgetProduct, WidgetVariant } from '@/lib/campaigns/widget-types';
import { addToCart, hydrateCart } from '../context/ikas';
import { goToCart, openCartDrawerWithFallback } from '../context/cart-drawer';
import { track } from '../transport/events';
import { el } from './dom';
import { createShadowHost } from './shadow-host';
import { createStickyTab } from './sticky-tab';
import { createPanel } from './panel';
import { createCountdown } from './countdown';
import { createProductCard } from './product-card';
import { createProductSwitcher } from './product-switcher';
import { createVariantPicker } from './variant-picker';
import { createCta } from './cta';

const DISMISS_PREFIX = 'rush.dismissed.';
const CONVERTED_PREFIX = 'rush.converted.';
const CONVERSION_HIDE_DELAY_MS = 2600;
const CONVERSION_RESET_DELAY_MS = 4200;

export type RenderedCampaign = { destroy: () => void; isMounted: () => boolean };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function stateKey(campaign: WidgetCampaign): string {
  return `${campaign.id}.${campaign.version}`;
}

function isDismissed(campaignId: string): boolean {
  try {
    return localStorage.getItem(DISMISS_PREFIX + campaignId) === today();
  } catch {
    return false;
  }
}

function markDismissed(campaignId: string): void {
  try {
    localStorage.setItem(DISMISS_PREFIX + campaignId, today());
  } catch {
    return;
  }
}

function conversionStore(mode: AfterConversion): Storage | null {
  if (mode === 'hideSession') return sessionStorage;
  if (mode === 'hideDay') return localStorage;
  return null;
}

function isConverted(campaignId: string, mode: AfterConversion): boolean {
  try {
    const store = conversionStore(mode);
    if (!store) return false;
    const stamp = store.getItem(CONVERTED_PREFIX + campaignId);
    if (!stamp) return false;
    return mode === 'hideDay' ? stamp === today() : true;
  } catch {
    return false;
  }
}

function markConverted(campaignId: string, mode: AfterConversion): void {
  try {
    const store = conversionStore(mode);
    if (store) store.setItem(CONVERTED_PREFIX + campaignId, today());
  } catch {
    return;
  }
}

function resolveEndsAt(campaignId: string, countdown: WidgetCampaign['data']['countdown']): number | undefined {
  if (countdown.mode === 'fixed') return countdown.endsAt;
  if (!countdown.durationSec) return undefined;

  const key = `rush.session.${campaignId}`;
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) return parsed;
    }
    const endsAt = Date.now() + countdown.durationSec * 1000;
    sessionStorage.setItem(key, String(endsAt));
    return endsAt;
  } catch {
    return Date.now() + countdown.durationSec * 1000;
  }
}

function defaultVariant(product: WidgetProduct): WidgetVariant {
  return product.variants.find((variant) => variant.inStock) ?? product.variants[0];
}

export function renderOfferProduct(campaign: WidgetCampaign): RenderedCampaign | null {
  const { data, appearance } = campaign;
  if (!data.products.length) return null;

  const key = stateKey(campaign);
  if (isDismissed(key)) return null;
  if (isConverted(key, data.afterConversion)) return null;

  const endsAt = resolveEndsAt(key, data.countdown);
  if (endsAt !== undefined && endsAt <= Date.now()) return null;

  const maybeShadow = createShadowHost(campaign.id, appearance);
  if (!maybeShadow) return null;
  const shadow = maybeShadow;

  let activeIndex = 0;
  let activeProduct = data.products[0];
  let selection: WidgetVariant = defaultVariant(activeProduct);
  let countdownHandle: { stop: () => void } | null = null;
  let activePicker: { destroy: () => void } | null = null;
  let panelMounted = false;
  let converted = false;
  let destroyed = false;
  let pending = false;

  const tab = createStickyTab(data.tabLabel, appearance, () => togglePanel());
  const panel = createPanel(shadow.root, data.headline, data.subtitle, (reason) => {
    tab.setAttribute('aria-expanded', 'false');
    if (converted || reason !== 'button') return;

    markDismissed(key);
    track(campaign.id, 'DISMISS');
  });

  shadow.container.appendChild(tab);
  shadow.container.appendChild(panel.node);

  const stage = el('div', 'rush-stage');
  const cta = createCta(data.ctaLabel, () => handleCta());
  const switcher = data.products.length > 1 ? createProductSwitcher(data.products.length, (step) => showProduct(activeIndex + step)) : null;

  function syncCtaState() {
    if (activeProduct.hasOptions) return cta.setState('redirect');
    if (!selection.inStock) return cta.setState('soldout');
    cta.setState('idle');
  }

  function showProduct(index: number) {
    if (index < 0 || index >= data.products.length) return;

    activeIndex = index;
    activeProduct = data.products[index];
    selection = defaultVariant(activeProduct);

    if (activePicker) activePicker.destroy();
    activePicker = null;
    stage.innerHTML = '';

    const card = createProductCard(activeProduct, selection);
    if (switcher) {
      card.node.setAttribute('data-paged', 'true');
      card.node.appendChild(switcher.node);
    }
    stage.appendChild(card.node);

    const picker = createVariantPicker({
      variants: activeProduct.variants,
      types: activeProduct.variantTypes,
      initial: selection,
      onChange: (variant) => {
        selection = variant;
        card.update(variant);
        syncCtaState();
      },
    });
    if (picker) {
      activePicker = picker;
      stage.appendChild(picker.node);
    }
    if (switcher) switcher.sync(activeIndex);

    syncCtaState();
  }

  async function handleCta() {
    if (pending) return;

    track(campaign.id, 'CLICK', selection.id);

    if (activeProduct.hasOptions) {
      window.location.href = activeProduct.url;
      return;
    }

    pending = true;
    cta.setState('loading');

    let result: AddToCartOutcome;
    try {
      result = await addToCart(selection.id, activeProduct.quantity);
    } finally {
      pending = false;
    }

    if (destroyed) return;

    if (result.unavailable) {
      window.location.href = activeProduct.url;
      return;
    }

    if (!result.success) {
      const message = result.timedOut ? 'Sepet yanıt vermedi, tekrar deneyin.' : result.error || 'Ürün sepete eklenemedi.';
      cta.setState('retry', message);
      return;
    }

    track(campaign.id, 'ADD_TO_CART', selection.id, selection.offerPrice * activeProduct.quantity);
    converted = true;
    cta.setState('success');
    void hydrateCart();
    retireAfterConversion();
    revealCart();
  }

  function retireAfterConversion() {
    if (data.afterConversion === 'keep') {
      setTimeout(() => {
        if (destroyed) return;
        converted = false;
        syncCtaState();
      }, CONVERSION_RESET_DELAY_MS);
      return;
    }

    markConverted(key, data.afterConversion);
    setTimeout(() => destroy(), CONVERSION_HIDE_DELAY_MS);
  }

  function revealCart() {
    if (data.afterAddToCart === 'cart') {
      setTimeout(() => goToCart(), 600);
      return;
    }

    if (data.afterAddToCart === 'drawer') {
      setTimeout(() => {
        panel.close('programmatic');
        openCartDrawerWithFallback(data.cartTriggerSelector || undefined, () => {
          if (!destroyed) panel.open();
        });
      }, 1200);
      return;
    }

    if (data.afterConversion === 'keep') return;

    setTimeout(() => panel.close('programmatic'), 2000);
  }

  function mountPanelBody() {
    if (panelMounted) return;
    panelMounted = true;

    if (endsAt !== undefined) {
      const countdown = createCountdown(endsAt, 'Fırsatın bitmesine', () => handleExpiry());
      countdownHandle = countdown;
      panel.body.appendChild(countdown.node);
    }

    panel.body.appendChild(stage);
    panel.body.appendChild(cta.node);
    showProduct(0);
  }

  function handleExpiry() {
    panel.body.innerHTML = '';
    panel.body.appendChild(el('div', 'rush-ended', 'Fırsat sona erdi'));
    setTimeout(() => destroy(), 3000);
  }

  function togglePanel() {
    if (panel.isOpen()) {
      panel.close('button');
      return;
    }

    mountPanelBody();
    panel.open();
    tab.setAttribute('aria-expanded', 'true');
    track(campaign.id, 'OPEN');
  }

  const observer = new IntersectionObserver((entries) => {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        track(campaign.id, 'IMPRESSION');
        observer.disconnect();
        break;
      }
    }
  });
  observer.observe(tab);

  if (appearance.autoOpen) {
    setTimeout(() => {
      if (!panel.isOpen()) togglePanel();
    }, appearance.autoOpenDelaySec * 1000);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    observer.disconnect();
    if (countdownHandle) countdownHandle.stop();
    if (activePicker) activePicker.destroy();
    panel.destroy();
    shadow.destroy();
  }

  return { destroy, isMounted: () => !destroyed && shadow.host.isConnected };
}
