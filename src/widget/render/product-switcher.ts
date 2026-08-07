import { el } from './dom';

export type ProductSwitcher = {
  node: HTMLElement;
  sync: (index: number) => void;
};

const CHEVRON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

function chevron(label: string, direction: 'previous' | 'next', onClick: () => void): HTMLButtonElement {
  const button = el('button', 'rush-nav');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.setAttribute('data-direction', direction);
  button.innerHTML = CHEVRON;
  button.addEventListener('click', onClick);
  return button;
}

export function createProductSwitcher(total: number, onSelect: (step: number) => void): ProductSwitcher {
  const node = el('div', 'rush-nav-row');

  const previous = chevron('Önceki ürün', 'previous', () => onSelect(-1));
  const next = chevron('Sonraki ürün', 'next', () => onSelect(1));

  node.appendChild(previous);
  node.appendChild(next);

  const sync = (index: number) => {
    previous.disabled = index === 0;
    next.disabled = index === total - 1;
    node.setAttribute('aria-label', `${index + 1} / ${total}`);
  };

  return { node, sync };
}
