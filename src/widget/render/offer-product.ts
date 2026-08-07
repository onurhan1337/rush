import type { WidgetCampaign, WidgetProduct, WidgetVariant } from '@/lib/campaigns/widget-types';
import { addToCart } from '../context/ikas';
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

export type RenderedCampaign = { destroy: () => void };

function today(): string {
  return new Date().toISOString().slice(0, 10);
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
    // storage unavailable — dismissal simply does not persist
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
  if (isDismissed(campaign.id)) return null;

  const endsAt = resolveEndsAt(campaign.id, data.countdown);
  if (endsAt !== undefined && endsAt <= Date.now()) return null;

  const maybeShadow = createShadowHost(campaign.id, appearance);
  if (!maybeShadow) return null;
  const shadow = maybeShadow;

  let activeIndex = 0;
  let activeProduct = data.products[0];
  let selection: WidgetVariant[] = [defaultVariant(activeProduct)];
  let countdownHandle: { stop: () => void } | null = null;
  let panelMounted = false;

  const tab = createStickyTab(data.tabLabel, appearance, () => togglePanel());
  const panel = createPanel(shadow.root, data.headline, data.subtitle, () => {
    tab.setAttribute('aria-expanded', 'false');
  });

  shadow.container.appendChild(tab);
  shadow.container.appendChild(panel.node);

  const stage = el('div', 'rush-stage');
  const cta = createCta(data.ctaLabel, () => handleCta());
  const switcher = data.products.length > 1 ? createProductSwitcher(data.products.length, (step) => showProduct(activeIndex + step)) : null;

  function syncCtaState() {
    if (activeProduct.hasOptions) return cta.setState('redirect');
    if (!selection.some((variant) => variant.inStock)) return cta.setState('soldout');
    cta.setState('idle');
  }

  function showProduct(index: number) {
    if (index < 0 || index >= data.products.length) return;

    activeIndex = index;
    activeProduct = data.products[index];
    selection = [defaultVariant(activeProduct)];
    stage.innerHTML = '';

    if (switcher) {
      switcher.sync(activeIndex);
      stage.appendChild(switcher.node);
    }

    const card = createProductCard(activeProduct, selection[0]);
    stage.appendChild(card.node);

    const picker = createVariantPicker({
      variants: activeProduct.variants,
      style: data.variantStyle,
      selection: data.variantSelection,
      currencySymbol: activeProduct.currencySymbol,
      onChange: (variants) => {
        selection = variants;
        card.update(variants[0]);
        syncCtaState();
      },
    });
    if (picker) stage.appendChild(picker.node);

    syncCtaState();
  }

  async function handleCta() {
    track(campaign.id, 'CLICK', selection[0]?.id);

    if (activeProduct.hasOptions) {
      window.location.href = activeProduct.url;
      return;
    }

    cta.setState('loading');

    for (const variant of selection) {
      const result = await addToCart(variant.id, activeProduct.quantity);

      if (result.unavailable) {
        window.location.href = activeProduct.url;
        return;
      }

      if (!result.success) {
        cta.setState('error', result.error || 'Ürün sepete eklenemedi.');
        return;
      }

      track(campaign.id, 'ADD_TO_CART', variant.id, variant.offerPrice * activeProduct.quantity);
    }

    cta.setState('success');
    setTimeout(() => panel.close(), 2000);
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
      panel.close();
      markDismissed(campaign.id);
      track(campaign.id, 'DISMISS');
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
    observer.disconnect();
    if (countdownHandle) countdownHandle.stop();
    panel.destroy();
    shadow.destroy();
  }

  return { destroy };
}
