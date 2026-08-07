import type { VariantSelection, VariantStyle } from '@/lib/campaigns/types/offer-product/schema';
import type { WidgetVariant } from '@/lib/campaigns/widget-types';
import { el, formatMoney } from './dom';

export type VariantPicker = {
  node: HTMLElement;
  selected: () => WidgetVariant[];
};

type Options = {
  variants: WidgetVariant[];
  style: VariantStyle;
  selection: VariantSelection;
  currencySymbol: string;
  onChange: (selected: WidgetVariant[]) => void;
};

function paintMedia(node: HTMLElement, variant: WidgetVariant): void {
  if (variant.media && !variant.media.isVideo) node.style.backgroundImage = `url("${variant.media.url}")`;
  else if (variant.swatchColor) node.style.background = variant.swatchColor;
}

function buttonContent(button: HTMLButtonElement, variant: WidgetVariant, style: VariantStyle, currencySymbol: string): void {
  if (style === 'swatch') {
    const dot = el('span', 'rush-variant-dot');
    if (variant.swatchColor) dot.style.background = variant.swatchColor;
    else paintMedia(dot, variant);
    button.appendChild(dot);
    button.appendChild(el('span', 'rush-variant-label', variant.label));
    return;
  }

  if (style === 'image') {
    const thumb = el('span', 'rush-variant-thumb');
    paintMedia(thumb, variant);
    button.appendChild(thumb);
    button.appendChild(el('span', 'rush-variant-label', variant.label));
    return;
  }

  if (style === 'list') {
    button.appendChild(el('span', 'rush-variant-mark'));
    button.appendChild(el('span', 'rush-variant-label', variant.label));
    button.appendChild(el('span', 'rush-variant-price', formatMoney(variant.offerPrice, currencySymbol)));
    return;
  }

  button.appendChild(el('span', 'rush-variant-label', variant.label));
}

export function createVariantPicker({ variants, style, selection, currencySymbol, onChange }: Options): VariantPicker | null {
  if (variants.length < 2) return null;

  const node = el('div', 'rush-variants');
  node.setAttribute('data-style', style);
  node.setAttribute('data-selection', selection);
  node.setAttribute('role', 'group');
  node.setAttribute('aria-label', 'Varyant seçimi');

  const entries: Array<{ button: HTMLButtonElement; variant: WidgetVariant }> = [];
  const chosen = new Set<string>();
  chosen.add((variants.find((variant) => variant.inStock) ?? variants[0]).id);

  const selected = () => variants.filter((variant) => chosen.has(variant.id));

  const sync = () => {
    for (const entry of entries) entry.button.setAttribute('aria-pressed', chosen.has(entry.variant.id) ? 'true' : 'false');
    onChange(selected());
  };

  const toggle = (variant: WidgetVariant) => {
    if (selection === 'multi') {
      if (!chosen.has(variant.id)) chosen.add(variant.id);
      else if (chosen.size > 1) chosen.delete(variant.id);
      else return;
    } else {
      chosen.clear();
      chosen.add(variant.id);
    }
    sync();
  };

  for (const variant of variants) {
    const button = el('button', 'rush-variant');
    button.type = 'button';
    button.setAttribute('aria-label', variant.label);
    button.setAttribute('aria-pressed', chosen.has(variant.id) ? 'true' : 'false');
    if (!variant.inStock) button.disabled = true;
    buttonContent(button, variant, style, currencySymbol);
    button.addEventListener('click', () => toggle(variant));
    entries.push({ button, variant });
    node.appendChild(button);
  }

  return { node, selected };
}
