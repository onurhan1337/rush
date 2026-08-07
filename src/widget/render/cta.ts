import { el } from './dom';

export type CtaState = 'idle' | 'loading' | 'success' | 'error' | 'soldout' | 'redirect';

export type Cta = {
  node: HTMLElement;
  button: HTMLButtonElement;
  setState: (state: CtaState, message?: string) => void;
};

const LABELS: Partial<Record<CtaState, string>> = {
  success: '✓ Sepete eklendi',
  soldout: 'Tükendi',
  redirect: 'Ürüne git',
};

export function createCta(label: string, onClick: () => void): Cta {
  const node = el('div');
  const button = el('button', 'rush-cta', label);
  button.type = 'button';
  button.addEventListener('click', onClick);

  const error = el('div', 'rush-error');
  error.style.display = 'none';

  node.appendChild(button);
  node.appendChild(error);

  const setState = (state: CtaState, message?: string) => {
    error.style.display = 'none';
    button.disabled = state === 'loading' || state === 'soldout';
    button.setAttribute('data-state', state);
    button.textContent = '';

    if (state === 'loading') {
      const dots = el('span', 'rush-dots');
      dots.appendChild(el('span'));
      dots.appendChild(el('span'));
      dots.appendChild(el('span'));
      button.appendChild(dots);
      return;
    }

    button.textContent = LABELS[state] ?? label;

    if (state === 'error' && message) {
      error.textContent = message;
      error.style.display = '';
    }
  };

  setState('idle');

  return { node, button, setState };
}
