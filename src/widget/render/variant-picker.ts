import type { WidgetVariant } from '@/lib/campaigns/widget-types';
import { el } from './dom';

export function createVariantPicker(
  variants: WidgetVariant[],
  selectedId: string,
  onSelect: (variant: WidgetVariant) => void,
): HTMLElement | null {
  if (variants.length < 2) return null;

  const node = el('div', 'rush-variants');
  node.setAttribute('role', 'group');
  node.setAttribute('aria-label', 'Varyant seçimi');

  const buttons: Array<{ button: HTMLButtonElement; variant: WidgetVariant }> = [];

  const setSelected = (id: string) => {
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].button.setAttribute('aria-pressed', buttons[i].variant.id === id ? 'true' : 'false');
    }
  };

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const button = el('button', 'rush-variant', variant.label);
    button.type = 'button';
    button.setAttribute('aria-pressed', variant.id === selectedId ? 'true' : 'false');
    if (!variant.inStock) button.disabled = true;
    button.addEventListener('click', () => {
      setSelected(variant.id);
      onSelect(variant);
    });
    buttons.push({ button, variant });
    node.appendChild(button);
  }

  return node;
}
