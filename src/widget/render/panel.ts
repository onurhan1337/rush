import { el } from './dom';

export type CloseReason = 'button' | 'escape' | 'outside' | 'programmatic';

export type Panel = {
  node: HTMLElement;
  body: HTMLElement;
  open: () => void;
  close: (reason?: CloseReason) => void;
  isOpen: () => boolean;
  destroy: () => void;
};

const FOCUSABLE = 'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])';

export function createPanel(root: ShadowRoot, headline: string, subtitle: string, onClose: (reason: CloseReason) => void): Panel {
  const container = root.querySelector<HTMLElement>('.rush-root');
  const node = el('div', 'rush-panel');
  node.setAttribute('role', 'dialog');
  node.setAttribute('aria-modal', 'false');
  node.setAttribute('aria-label', headline);
  node.setAttribute('data-open', 'false');
  node.style.display = 'none';

  const close = el('button', 'rush-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Kapat');
  node.appendChild(close);

  node.appendChild(el('div', 'rush-headline', headline));
  if (subtitle) node.appendChild(el('div', 'rush-subtitle', subtitle));

  const body = el('div');
  node.appendChild(body);

  let opened = false;

  const handleKeydown = (event: KeyboardEvent) => {
    if (!opened) return;

    if (event.key === 'Escape') {
      event.stopPropagation();
      doClose('escape');
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = root.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleOutside = (event: Event) => {
    if (!opened) return;
    const path = event.composedPath();
    if (path.indexOf(node) === -1 && path.indexOf(root.host) === -1) doClose('outside');
  };

  function doOpen() {
    if (opened) return;
    opened = true;
    node.style.display = '';
    container?.setAttribute('data-open', 'true');
    requestAnimationFrame(() => node.setAttribute('data-open', 'true'));
    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('click', handleOutside, true);
    const focusable = node.querySelector<HTMLElement>(FOCUSABLE);
    if (focusable) focusable.focus();
  }

  function doClose(reason: CloseReason = 'programmatic') {
    if (!opened) return;
    opened = false;
    node.setAttribute('data-open', 'false');
    node.style.display = 'none';
    container?.setAttribute('data-open', 'false');
    document.removeEventListener('keydown', handleKeydown, true);
    document.removeEventListener('click', handleOutside, true);
    onClose(reason);
  }

  close.addEventListener('click', () => doClose('button'));

  return {
    node,
    body,
    open: doOpen,
    close: doClose,
    isOpen: () => opened,
    destroy: () => {
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('click', handleOutside, true);
    },
  };
}
