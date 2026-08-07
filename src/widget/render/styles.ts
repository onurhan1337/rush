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
  flex: none;
}
.rush-root[data-side="left"] .rush-tab { border-radius: 0 var(--rush-radius) var(--rush-radius) 0; }
.rush-root[data-side="right"] .rush-tab { border-radius: var(--rush-radius) 0 0 var(--rush-radius); }
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
  align-items: center;
  gap: 12px;
  background: #F5F5F5;
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
}
.rush-media {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  background: #E5E5E5;
  flex: none;
  position: relative;
}
.rush-media img, .rush-media video { width: 100%; height: 100%; object-fit: cover; display: none; }
.rush-media[data-state="image"] img { display: block; }
.rush-media[data-state="video"] video { display: block; }
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

.rush-nav-row { display: flex; align-items: center; justify-content: flex-end; gap: 2px; margin-top: 12px; }
.rush-nav-count { font-size: 11px; color: #9CA3AF; font-variant-numeric: tabular-nums; margin-right: 4px; }
.rush-nav {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: none;
  box-shadow: none;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rush-nav svg { width: 16px; height: 16px; }
.rush-nav[data-direction="next"] svg { transform: rotate(180deg); }
.rush-nav:hover { color: #0A0A0A; }
.rush-nav[disabled] { opacity: .25; cursor: default; }

.rush-variants { display: flex; gap: 8px; margin-top: 12px; overflow-x: auto; padding-bottom: 2px; }
.rush-variant {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #E5E5E5;
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  color: #0A0A0A;
  transition: border-color 140ms ease, background-color 140ms ease;
}
.rush-variant:hover:not([disabled]) { border-color: #A3A3A3; }
.rush-variant[aria-pressed="true"] { border-color: var(--rush-accent); box-shadow: inset 0 0 0 1px var(--rush-accent); font-weight: 600; }
.rush-variant[disabled] { text-decoration: line-through; opacity: .45; cursor: not-allowed; }
.rush-variant-dot, .rush-variant-thumb {
  flex: none;
  background: #E5E5E5 center/cover no-repeat;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
}
.rush-variant-dot { width: 14px; height: 14px; border-radius: 50%; }
.rush-variant-thumb { width: 28px; height: 28px; border-radius: 6px; }

.rush-variants[data-style="image"] .rush-variant { border-radius: 10px; padding: 5px 10px 5px 5px; }
.rush-variants[data-style="list"] { flex-direction: column; gap: 6px; overflow-x: visible; }
.rush-variants[data-style="list"] .rush-variant { width: 100%; border-radius: 10px; padding: 10px 12px; }
.rush-variants[data-style="list"] .rush-variant-label { flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; }
.rush-variant-price { font-variant-numeric: tabular-nums; color: #6B7280; }
.rush-variant-mark {
  flex: none;
  width: 16px;
  height: 16px;
  border: 1px solid #D4D4D4;
  border-radius: 50%;
  position: relative;
}
.rush-variants[data-style="list"][data-selection="multi"] .rush-variant-mark { border-radius: 5px; }
.rush-variant[aria-pressed="true"] .rush-variant-mark { border-color: var(--rush-accent); background: var(--rush-accent); }
.rush-variant[aria-pressed="true"] .rush-variant-mark::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: inherit;
  background: #fff;
}

.rush-cta {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--rush-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .02em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: filter 140ms ease, background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}
.rush-cta:hover:not([disabled]) { filter: brightness(1.12); box-shadow: 0 4px 14px rgba(0,0,0,.16); }
.rush-cta:active:not([disabled]) { filter: brightness(.94); box-shadow: none; }
.rush-cta:focus-visible { outline: 2px solid var(--rush-accent); outline-offset: 2px; }
.rush-cta[data-state="success"] { background: #16A34A; }

.rush-root[data-cta="outline"] .rush-cta { background: transparent; color: var(--rush-accent); border-color: var(--rush-accent); }
.rush-root[data-cta="outline"] .rush-cta:hover:not([disabled]) { background: var(--rush-accent); color: #fff; filter: none; }
.rush-root[data-cta="soft"] .rush-cta { background: #F5F5F5; color: #0A0A0A; }
.rush-root[data-cta="soft"] .rush-cta:hover:not([disabled]) { background: #EAEAEA; filter: none; box-shadow: none; }
.rush-root[data-cta="soft"] .rush-cta[data-state="success"], .rush-root[data-cta="outline"] .rush-cta[data-state="success"] { background: #16A34A; color: #fff; border-color: #16A34A; }

.rush-cta[disabled] { opacity: .5; cursor: not-allowed; }
.rush-error { margin-top: 8px; font-size: 12px; color: #DC2626; }

.rush-dots { display: inline-flex; gap: 4px; }
.rush-dots span { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: rush-blink 1s infinite; }
.rush-dots span:nth-child(2) { animation-delay: .15s; }
.rush-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes rush-blink { 0%, 60%, 100% { opacity: .25; } 30% { opacity: 1; } }

.rush-ended { margin-top: 16px; font-size: 13px; color: #8A8A8A; text-align: center; }

@media (prefers-reduced-motion: reduce) {
  .rush-panel, .rush-cta, .rush-variant { transition: none; }
  .rush-dots span { animation: none; opacity: 1; }
}

@media (max-width: 480px) {
  .rush-panel { width: calc(100vw - 60px); max-width: 360px; }
}
`;

export function applyAppearanceVars(host: HTMLElement, appearance: Appearance): void {
  host.style.setProperty('--rush-accent', appearance.accentColor);
  host.style.setProperty('--rush-radius', `${appearance.radius}px`);
  host.setAttribute('data-cta', appearance.ctaStyle);
}
