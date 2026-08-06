import { el } from './dom';

export type CtaState = 'idle' | 'loading' | 'success' | 'error' | 'soldout' | 'redirect';

export type Cta = {
  node: HTMLElement;
  button: HTMLButtonElement;
  setState: (state: CtaState, message?: string) => void;
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
    button.disabled = false;
    button.textContent = '';

    if (state === 'loading') {
      button.disabled = true;
      const dots = el('span', 'rush-dots');
      dots.appendChild(el('span'));
      dots.appendChild(el('span'));
      dots.appendChild(el('span'));
      button.appendChild(dots);
      return;
    }

    if (state === 'success') {
      button.textContent = '✓ Sepete eklendi';
      return;
    }

    if (state === 'soldout') {
      button.disabled = true;
      button.textContent = 'TÜKENDİ';
      return;
    }

    if (state === 'redirect') {
      button.textContent = 'ÜRÜNE GİT';
      return;
    }

    button.textContent = label;

    if (state === 'error' && message) {
      error.textContent = message;
      error.style.display = '';
    }
  };

  setState('idle');

  return { node, button, setState };
}
