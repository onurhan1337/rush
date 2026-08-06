import type { AppearanceIcon } from '@/lib/campaigns/appearance';

const PATHS: Record<Exclude<AppearanceIcon, 'none'>, string> = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M12 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 0a3 3 0 1 1 3-3 3 3 0 0 1-3 3z"/>',
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
};

export function iconSvg(icon: AppearanceIcon): string {
  if (icon === 'none') return '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[icon]}</svg>`;
}
