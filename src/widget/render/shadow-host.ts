import type { Appearance, MountTarget } from '@/lib/campaigns/appearance';
import { STYLES, applyAppearanceVars } from './styles';

export type ShadowHost = {
  host: HTMLElement;
  root: ShadowRoot;
  container: HTMLElement;
  destroy: () => void;
};

function resolveMountTarget(target: MountTarget, host: HTMLElement): boolean {
  if (target.mode === 'selector') {
    const anchor = document.querySelector(target.selector);
    if (!anchor || !anchor.parentNode) return false;
    if (target.position === 'append') anchor.appendChild(host);
    else if (target.position === 'before') anchor.parentNode.insertBefore(host, anchor);
    else anchor.parentNode.insertBefore(host, anchor.nextSibling);
    return true;
  }

  document.body.appendChild(host);
  return true;
}

export function createShadowHost(campaignId: string, appearance: Appearance): ShadowHost | null {
  const host = document.createElement('div');
  host.setAttribute('data-rush', campaignId);
  host.style.all = 'initial';

  if (!resolveMountTarget(appearance.mount, host)) return null;

  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = STYLES;
  root.appendChild(style);

  const container = document.createElement('div');
  container.className = 'rush-root';
  container.setAttribute('data-side', appearance.mount.mode === 'fixed' ? appearance.mount.side : 'left');
  root.appendChild(container);

  applyAppearanceVars(container, appearance);

  return {
    host,
    root,
    container,
    destroy: () => {
      if (host.parentNode) host.parentNode.removeChild(host);
    },
  };
}
