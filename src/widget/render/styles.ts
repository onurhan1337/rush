import { hover, readableOn, shade, tint } from '@/lib/color';
import { radiusScale, type Appearance } from '@/lib/campaigns/appearance';

export const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; padding: 0; font-family: inherit; }
button {
  font: inherit;
  color: inherit;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: none;
  appearance: none;
}

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
.rush-root[data-side="left"] { left: env(safe-area-inset-left, 0px); flex-direction: row; }
.rush-root[data-side="right"] { right: env(safe-area-inset-right, 0px); flex-direction: row-reverse; }

.rush-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 36px;
  padding: 18px 0;
  background: var(--rush-accent);
  color: var(--rush-on-accent);
  border: none;
  cursor: pointer;
  flex: none;
  transition: background-color 200ms ease;
}
.rush-root[data-side="left"] .rush-tab { border-radius: 0 var(--rush-radius-tab) var(--rush-radius-tab) 0; }
.rush-root[data-side="right"] .rush-tab { border-radius: var(--rush-radius-tab) 0 0 var(--rush-radius-tab); }
.rush-tab svg { width: 16px; height: 16px; flex: none; transition: transform 260ms cubic-bezier(.34,1.4,.64,1); }
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
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border-radius: var(--rush-radius-panel);
  box-shadow: 0 8px 32px rgba(0,0,0,.12);
  padding: 20px;
  margin: 0 8px;
  position: relative;
  opacity: 0;
  transition: opacity 220ms ease, transform 260ms cubic-bezier(.22,1,.36,1);
}
.rush-root[data-side="left"] .rush-panel { transform: translateX(-12px); }
.rush-root[data-side="right"] .rush-panel { transform: translateX(12px); }
.rush-panel[data-open="true"] { opacity: 1; transform: translateX(0); }

.rush-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: #9CA3AF;
  cursor: pointer;
  line-height: 1;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 160ms ease, transform 260ms cubic-bezier(.34,1.4,.64,1);
}

.rush-headline { font-size: 16px; font-weight: 600; padding-right: 24px; }
.rush-subtitle { font-size: 13px; color: #8A8A8A; margin-top: 4px; }

.rush-countdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #F5F5F5;
  border-radius: var(--rush-radius-surface);
  padding: 12px;
  margin-top: 16px;
}
.rush-countdown-label { font-size: 12px; color: #8A8A8A; }
.rush-countdown-cells { display: flex; gap: 6px; }
.rush-cell {
  width: 36px;
  height: 36px;
  border-radius: var(--rush-radius-control);
  background: var(--rush-secondary);
  color: var(--rush-on-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.rush-cell[data-tick="true"] span { animation: rush-tick 300ms cubic-bezier(.22,1,.36,1); }
@keyframes rush-tick {
  0% { opacity: 0; transform: translateY(-45%); }
  100% { opacity: 1; transform: translateY(0); }
}

.rush-product {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #F5F5F5;
  border-radius: var(--rush-radius-surface);
  padding: 12px;
  margin-top: 12px;
}
.rush-product[data-paged="true"] { padding-right: 60px; }
.rush-media {
  width: 72px;
  height: 72px;
  border-radius: var(--rush-radius-control);
  overflow: hidden;
  background: #E5E5E5;
  flex: none;
  position: relative;
}
.rush-media img, .rush-media video { width: 100%; height: 100%; object-fit: cover; display: none; }
.rush-media[data-state="image"] img { display: block; }
.rush-media[data-state="video"] video { display: block; }
.rush-product-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
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
.rush-new { font-size: 15px; font-weight: 700; color: var(--rush-secondary-ink); }

.rush-nav-row {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0;
}
.rush-nav {
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  box-shadow: none;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 160ms ease, transform 220ms cubic-bezier(.34,1.4,.64,1);
}
.rush-nav svg { width: 16px; height: 16px; }
.rush-nav[data-direction="next"] svg { transform: rotate(180deg); }
.rush-nav[disabled] { opacity: .28; cursor: default; }

.rush-variant-groups { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.rush-variant-group { display: flex; flex-direction: column; gap: 6px; }
.rush-variant-group-label { font-size: 11px; font-weight: 500; color: #8A8A8A; }
.rush-variants {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}
.rush-variants::-webkit-scrollbar { display: none; }
.rush-variant {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  min-height: 32px;
  border: 1px solid #E5E5E5;
  background: #fff;
  border-radius: var(--rush-radius-pill);
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  color: #0A0A0A;
  transition: border-color 160ms ease, background-color 160ms ease, transform 120ms ease;
}
.rush-variant:active:not([disabled]) { transform: scale(.96); }
.rush-variant[aria-pressed="true"] { border-color: var(--rush-accent); box-shadow: inset 0 0 0 1px var(--rush-accent); font-weight: 600; }
.rush-variant[disabled] { text-decoration: line-through; opacity: .45; cursor: not-allowed; }
.rush-variant-dot {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #E5E5E5 center/cover no-repeat;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.12);
  transition: transform 220ms cubic-bezier(.34,1.4,.64,1);
}
.rush-variant[aria-pressed="true"] .rush-variant-dot { transform: scale(1.15); }
.rush-variant-dot[data-blank="true"] { background: repeating-linear-gradient(45deg, #E5E5E5 0 3px, #F5F5F5 3px 6px); }
.rush-variant-group[data-selection="color"] .rush-variant { padding: 5px 12px 5px 6px; }

.rush-cta {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 48px;
  margin-top: 16px;
  border: 1.5px solid transparent;
  border-radius: var(--rush-radius-control);
  background: var(--rush-accent);
  color: var(--rush-on-accent);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .06em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease;
}
.rush-cta::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 38%, var(--rush-sheen) 50%, transparent 62%);
  transform: translateX(-110%);
  pointer-events: none;
}
.rush-cta:focus-visible { outline: 2px solid var(--rush-accent); outline-offset: 2px; }
.rush-cta[data-state="success"] { background: #16A34A; border-color: #16A34A; color: #fff; }

.rush-root[data-cta="gradient"] .rush-cta { background: linear-gradient(120deg, var(--rush-accent) 0%, var(--rush-secondary) 100%); }
.rush-root[data-cta="outline"] .rush-cta { background: transparent; color: var(--rush-accent-ink); border-color: var(--rush-accent); }
.rush-root[data-cta="soft"] .rush-cta { background: var(--rush-accent-soft); color: var(--rush-accent-ink); border-color: transparent; }

@media (hover: hover) and (pointer: fine) {
  .rush-cta:hover:not([disabled]) { background-color: var(--rush-accent-hover); }
  .rush-cta:hover:not([disabled])::after { animation: rush-sheen 720ms cubic-bezier(.22,1,.36,1); }
  .rush-root[data-cta="gradient"] .rush-cta:hover:not([disabled]) {
    background: linear-gradient(120deg, var(--rush-accent-hover) 0%, var(--rush-secondary-hover) 100%);
  }
  .rush-root[data-cta="outline"] .rush-cta:hover:not([disabled]) { background: var(--rush-accent); color: var(--rush-on-accent); }
  .rush-root[data-cta="soft"] .rush-cta:hover:not([disabled]) { background: var(--rush-accent-soft-hover); }
  .rush-tab:hover { background: var(--rush-accent-hover); }
  .rush-root[data-side="left"] .rush-tab:hover svg { transform: translateX(3px); }
  .rush-root[data-side="right"] .rush-tab:hover svg { transform: translateX(-3px); }
  .rush-nav:hover:not([disabled]) { color: #0A0A0A; }
  .rush-nav[data-direction="previous"]:hover:not([disabled]) { transform: translateX(-2px); }
  .rush-nav[data-direction="next"]:hover:not([disabled]) { transform: translateX(2px); }
  .rush-variant:hover:not([disabled]) { border-color: #A3A3A3; }
  .rush-close:hover { color: #0A0A0A; transform: rotate(90deg); }
}

@keyframes rush-sheen {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(110%); }
}

.rush-cta:active:not([disabled]) { background-color: var(--rush-accent-active); }
.rush-cta[disabled] { opacity: .5; cursor: not-allowed; }
.rush-error { margin-top: 8px; font-size: 12px; color: #DC2626; }

.rush-dots { display: inline-flex; gap: 4px; }
.rush-dots span { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: rush-blink 1s infinite; }
.rush-dots span:nth-child(2) { animation-delay: .15s; }
.rush-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes rush-blink { 0%, 60%, 100% { opacity: .25; } 30% { opacity: 1; } }

.rush-ended { margin-top: 16px; font-size: 13px; color: #8A8A8A; text-align: center; }

@media (prefers-reduced-motion: reduce) {
  .rush-panel, .rush-cta, .rush-variant, .rush-nav, .rush-close, .rush-tab svg, .rush-variant-dot { transition: none; }
  .rush-cta::after, .rush-cell[data-tick="true"] span { animation: none; }
  .rush-close:hover, .rush-nav:hover:not([disabled]), .rush-variant:active:not([disabled]) { transform: none; }
  .rush-dots span { animation: none; opacity: 1; }
}

@media (max-width: 640px) {
  .rush-panel { width: calc(100vw - 56px); max-width: 360px; padding: 18px 16px; }
  .rush-close { top: 10px; right: 10px; width: 32px; height: 32px; font-size: 20px; }
  .rush-headline { padding-right: 32px; }
  .rush-product[data-paged="true"] { padding-right: 74px; }
  .rush-nav { width: 34px; height: 34px; }
  .rush-variant { min-height: 40px; padding: 8px 14px; font-size: 13px; }
  .rush-cta { min-height: 52px; }
}
`;

export function applyAppearanceVars(host: HTMLElement, appearance: Appearance): void {
  const { accentColor, secondaryColor } = appearance;
  const radius = radiusScale(appearance.radius);
  const onAccent = readableOn(accentColor);

  const vars: Record<string, string> = {
    '--rush-accent': accentColor,
    '--rush-accent-hover': hover(accentColor),
    '--rush-accent-active': shade(accentColor, 0.14),
    '--rush-accent-soft': tint(accentColor, 0.9),
    '--rush-accent-soft-hover': tint(accentColor, 0.82),
    '--rush-accent-ink': shade(accentColor, 0.1),
    '--rush-on-accent': onAccent,
    '--rush-secondary': secondaryColor,
    '--rush-secondary-hover': hover(secondaryColor),
    '--rush-secondary-ink': shade(secondaryColor, 0.05),
    '--rush-on-secondary': readableOn(secondaryColor),
    '--rush-sheen': onAccent === '#FFFFFF' ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.12)',
    '--rush-radius-tab': `${radius.tab}px`,
    '--rush-radius-panel': `${radius.panel}px`,
    '--rush-radius-surface': `${radius.surface}px`,
    '--rush-radius-control': `${radius.control}px`,
    '--rush-radius-pill': radius.pill,
  };

  for (const [name, value] of Object.entries(vars)) host.style.setProperty(name, value);
  host.setAttribute('data-cta', appearance.ctaStyle);
}
