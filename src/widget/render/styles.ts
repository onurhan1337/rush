import type { Appearance } from '@/lib/campaigns/appearance';

export const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; padding: 0; font-family: inherit; }

.rush-root {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2147483000;
  display: flex;
  align-items: center;
  gap: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #0A0A0A;
}
.rush-root[data-side="left"] { left: 0; flex-direction: row; }
.rush-root[data-side="right"] { right: 0; flex-direction: row-reverse; }

.rush-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 34px;
  padding: 18px 0;
  background: var(--rush-accent);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: transform 160ms ease;
  flex: none;
}
.rush-root[data-side="left"] .rush-tab { border-radius: 0 var(--rush-radius) var(--rush-radius) 0; }
.rush-root[data-side="right"] .rush-tab { border-radius: var(--rush-radius) 0 0 var(--rush-radius); }
.rush-root[data-side="left"] .rush-tab:hover { transform: translateX(2px); }
.rush-root[data-side="right"] .rush-tab:hover { transform: translateX(-2px); }
.rush-tab svg { width: 16px; height: 16px; flex: none; }
.rush-tab-label {
  writing-mode: vertical-rl;
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.rush-root[data-side="right"] .rush-tab-label { writing-mode: vertical-lr; }

.rush-panel {
  width: 340px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,.12);
  padding: 20px;
  margin: 0 8px;
  position: relative;
  opacity: 0;
  transition: opacity 200ms ease, transform 200ms ease;
}
.rush-root[data-side="left"] .rush-panel { transform: translateX(-8px); }
.rush-root[data-side="right"] .rush-panel { transform: translateX(8px); }
.rush-panel[data-open="true"] { opacity: 1; transform: translateX(0); }

.rush-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: none;
  color: #9CA3AF;
  cursor: pointer;
  line-height: 1;
  font-size: 16px;
}
.rush-close:hover { color: #0A0A0A; }

.rush-headline { font-size: 16px; font-weight: 600; padding-right: 24px; }
.rush-subtitle { font-size: 13px; color: #8A8A8A; margin-top: 4px; }

.rush-countdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #F5F5F5;
  border-radius: 12px;
  padding: 12px;
  margin-top: 16px;
}
.rush-countdown-label { font-size: 12px; color: #8A8A8A; }
.rush-countdown-cells { display: flex; gap: 6px; }
.rush-cell {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--rush-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.rush-product {
  display: flex;
  gap: 12px;
  background: #F5F5F5;
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
}
.rush-product img { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; flex: none; background: #E5E5E5; }
.rush-product-info { min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.rush-product-name {
  font-size: 13px;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rush-prices { display: flex; align-items: baseline; gap: 8px; }
.rush-old { font-size: 12px; color: #9CA3AF; text-decoration: line-through; }
.rush-new { font-size: 15px; font-weight: 700; }

.rush-variants { display: flex; gap: 8px; margin-top: 12px; overflow-x: auto; padding-bottom: 2px; }
.rush-variant {
  border: 1px solid #E5E5E5;
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  color: #0A0A0A;
}
.rush-variant[aria-pressed="true"] { border-color: var(--rush-accent); box-shadow: inset 0 0 0 1px var(--rush-accent); font-weight: 600; }
.rush-variant[disabled] { text-decoration: line-through; opacity: .45; cursor: not-allowed; }

.rush-cta {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  border: none;
  border-radius: 10px;
  background: var(--rush-accent);
  color: #fff;
  text-transform: uppercase;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .06em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.rush-cta[disabled] { opacity: .5; cursor: not-allowed; }
.rush-error { margin-top: 8px; font-size: 12px; color: #DC2626; }

.rush-dots { display: inline-flex; gap: 4px; }
.rush-dots span { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: rush-blink 1s infinite; }
.rush-dots span:nth-child(2) { animation-delay: .15s; }
.rush-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes rush-blink { 0%, 60%, 100% { opacity: .25; } 30% { opacity: 1; } }

.rush-ended { margin-top: 16px; font-size: 13px; color: #8A8A8A; text-align: center; }

@media (prefers-reduced-motion: reduce) {
  .rush-panel, .rush-tab { transition: none; }
  .rush-dots span { animation: none; opacity: 1; }
}

@media (max-width: 480px) {
  .rush-panel { width: calc(100vw - 60px); max-width: 360px; }
}
`;

export function applyAppearanceVars(host: HTMLElement, appearance: Appearance): void {
  host.style.setProperty('--rush-accent', appearance.accentColor);
  host.style.setProperty('--rush-radius', `${appearance.radius}px`);
}
