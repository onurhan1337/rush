import type { WidgetCampaign, WidgetVariant } from '@/lib/campaigns/widget-types';
import { addToCart } from '../context/ikas';
import { track } from '../transport/events';
import { el } from './dom';
import { createShadowHost } from './shadow-host';
import { createStickyTab } from './sticky-tab';
import { createPanel } from './panel';
import { createCountdown } from './countdown';
import { createProductCard } from './product-card';
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

export function renderOfferProduct(campaign: WidgetCampaign): RenderedCampaign | null {
  const { data, appearance } = campaign;
  if (isDismissed(campaign.id)) return null;

  const endsAt = resolveEndsAt(campaign.id, data.countdown);
  if (endsAt !== undefined && endsAt <= Date.now()) return null;

  const maybeShadow = createShadowHost(campaign.id, appearance);
  if (!maybeShadow) return null;
  const shadow = maybeShadow;

  let selected: WidgetVariant = data.variants.find((variant) => variant.inStock) ?? data.variants[0];
  let countdownHandle: { stop: () => void } | null = null;
  let panelMounted = false;

  const tab = createStickyTab(data.tabLabel, appearance, () => togglePanel());
  const panel = createPanel(shadow.root, data.headline, data.subtitle, () => {
    tab.setAttribute('aria-expanded', 'false');
  });

  shadow.container.appendChild(tab);
  shadow.container.appendChild(panel.node);

  const productCard = createProductCard(data.productName, data.currencySymbol, selected);

  const cta = createCta(data.ctaLabel, () => handleCta());

  function syncCtaState() {
    if (data.hasOptions) return cta.setState('redirect');
    if (!selected.inStock) return cta.setState('soldout');
    cta.setState('idle');
  }

  async function handleCta() {
    track(campaign.id, 'CLICK', selected.id);

    if (data.hasOptions) {
      window.location.href = data.productUrl;
      return;
    }

    cta.setState('loading');
    const result = await addToCart(selected.id, data.quantity);

    if (result.success) {
      cta.setState('success');
      track(campaign.id, 'ADD_TO_CART', selected.id, selected.offerPrice * data.quantity);
      setTimeout(() => panel.close(), 2000);
      return;
    }

    if (result.unavailable) {
      window.location.href = data.productUrl;
      return;
    }

    cta.setState('error', result.error || 'Ürün sepete eklenemedi.');
  }

  function mountPanelBody() {
    if (panelMounted) return;
    panelMounted = true;

    if (endsAt !== undefined) {
      const countdown = createCountdown(endsAt, 'Fırsatın bitmesine', () => handleExpiry());
      countdownHandle = countdown;
      panel.body.appendChild(countdown.node);
    }

    panel.body.appendChild(productCard.node);

    const picker = createVariantPicker(data.variants, selected.id, (variant) => {
      selected = variant;
      productCard.update(variant);
      syncCtaState();
    });
    if (picker) panel.body.appendChild(picker);

    panel.body.appendChild(cta.node);
    syncCtaState();
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
