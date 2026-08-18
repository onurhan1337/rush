import { el, upperCase } from './dom';

export type CtaState = 'idle' | 'loading' | 'success' | 'error' | 'soldout' | 'redirect' | 'retry';

export type Cta = {
  node: HTMLElement;
  button: HTMLButtonElement;
  setState: (state: CtaState, message?: string) => void;
};

const LABELS: Partial<Record<CtaState, string>> = {
  success: '✓ Sepete eklendi',
  soldout: 'Tükendi',
  redirect: 'Ürüne git',
  retry: 'Tekrar dene',
};

export function createCta(label: string, onClick: () => void): Cta {
  const node = el('div');
  const button = el('button', 'rush-cta');
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
    button.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
    button.textContent = '';

    if (state === 'loading') {
      button.setAttribute('aria-label', 'Sepete ekleniyor');
      const dots = el('span', 'rush-dots');
      dots.appendChild(el('span'));
      dots.appendChild(el('span'));
      dots.appendChild(el('span'));
      button.appendChild(dots);
      return;
    }

    button.removeAttribute('aria-label');
    button.textContent = upperCase(LABELS[state] ?? label);

    if ((state === 'error' || state === 'retry') && message) {
      error.textContent = message;
      error.style.display = '';
    }
  };

  setState('idle');

  return { node, button, setState };
}
