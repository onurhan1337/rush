import { el } from './dom';

export type ProductSwitcher = {
  node: HTMLElement;
  sync: (index: number) => void;
};

const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';

function chevron(label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', 'rush-nav');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.innerHTML = CHEVRON;
  button.addEventListener('click', onClick);
  return button;
}

export function createProductSwitcher(total: number, onSelect: (index: number) => void): ProductSwitcher {
  const node = el('div', 'rush-nav-row');

  const previous = chevron('Önceki ürün', () => onSelect(-1));
  const next = chevron('Sonraki ürün', () => onSelect(1));
  next.setAttribute('data-direction', 'next');

  const counter = el('span', 'rush-nav-count');

  node.appendChild(counter);
  node.appendChild(previous);
  node.appendChild(next);

  const sync = (index: number) => {
    counter.textContent = `${index + 1}/${total}`;
    previous.disabled = index === 0;
    next.disabled = index === total - 1;
  };

  return { node, sync };
}
