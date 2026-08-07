import type { Appearance } from '@/lib/campaigns/appearance';
import { el } from './dom';
import { iconSvg } from './icons';

export function createStickyTab(label: string, appearance: Appearance, onClick: () => void): HTMLButtonElement {
  const tab = el('button', 'rush-tab');
  tab.type = 'button';
  tab.setAttribute('aria-label', label);
  tab.setAttribute('aria-expanded', 'false');

  const icon = iconSvg(appearance.icon);
  if (icon) {
    const wrapper = el('span');
    wrapper.innerHTML = icon;
    tab.appendChild(wrapper.firstElementChild!);
  }

  tab.appendChild(el('span', 'rush-tab-label', label));
  tab.addEventListener('click', onClick);

  return tab;
}
