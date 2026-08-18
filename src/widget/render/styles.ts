import { alpha, hover, readableOn, shade, tint } from '@/lib/color';
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
  font-family: var(--rush-font-body);
  color: var(--rush-ink);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
  position: relative;
  z-index: 1;
  opacity: .9;
  transition: opacity 200ms ease, border-radius 260ms cubic-bezier(.22,1,.36,1);
}
.rush-root[data-side="left"] .rush-tab { border-radius: 0 var(--rush-radius-tab) var(--rush-radius-tab) 0; }
.rush-root[data-side="right"] .rush-tab { border-radius: var(--rush-radius-tab) 0 0 var(--rush-radius-tab); }
.rush-root[data-open="true"] .rush-tab { opacity: 1; border-radius: 0; }
.rush-tab svg { width: 16px; height: 16px; flex: none; }
.rush-tab-label {
  font-family: var(--rush-font-display);
  writing-mode: vertical-rl;
  letter-spacing: .01em;
  font-size: 12px;
  font-weight: 500;
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
  background: var(--rush-glass-panel);
  -webkit-backdrop-filter: blur(40px) saturate(140%);
  backdrop-filter: blur(40px) saturate(140%);
  padding: 18px;
  position: relative;
  border: 1px solid var(--rush-hairline-light);
  opacity: 0;
  transition: opacity 220ms ease, transform 260ms cubic-bezier(.22,1,.36,1);
}
.rush-root[data-side="left"] .rush-panel {
  margin: 0 12px 0 0;
  border-radius: 0 var(--rush-radius-panel) var(--rush-radius-panel) 0;
  box-shadow: 12px 10px 40px rgba(15,15,15,.1), 0 1px 3px rgba(15,15,15,.05);
  transform: translateX(-12px);
}
.rush-root[data-side="right"] .rush-panel {
  margin: 0 0 0 12px;
  border-radius: var(--rush-radius-panel) 0 0 var(--rush-radius-panel);
  box-shadow: -12px 10px 40px rgba(15,15,15,.1), 0 1px 3px rgba(15,15,15,.05);
  transform: translateX(12px);
}
.rush-root[data-side="left"] .rush-panel[data-open="true"],
.rush-root[data-side="right"] .rush-panel[data-open="true"] { opacity: 1; transform: translateX(0); }

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

.rush-headline {
  font-family: var(--rush-font-display);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -.012em;
  color: var(--rush-ink);
  padding-right: 26px;
}
.rush-subtitle { font-size: 13px; line-height: 1.4; font-weight: 400; color: var(--rush-ink-soft); margin-top: 4px; }

.rush-countdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--rush-wash);
  border: 1px solid var(--rush-hairline);
  border-radius: var(--rush-radius-surface);
  padding: 10px 12px;
  margin-top: 16px;
}
.rush-countdown-label {
  font-size: 12px;
  font-weight: 450;
  letter-spacing: -.005em;
  color: var(--rush-ink-soft);
  transition: color 260ms ease;
}
.rush-countdown[data-urgent="true"] { background: var(--rush-urgent-soft); }
.rush-countdown[data-urgent="true"] .rush-countdown-label { color: var(--rush-urgent-ink); font-weight: 600; }
.rush-countdown[data-urgent="true"] .rush-cell { background: var(--rush-urgent); color: #FFFFFF; animation: rush-pulse 1.6s ease-in-out infinite; }
.rush-countdown[data-urgent="true"] .rush-cell:nth-child(2) { animation-delay: .12s; }
.rush-countdown[data-urgent="true"] .rush-cell:nth-child(3) { animation-delay: .24s; }
@keyframes rush-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
.rush-countdown-cells { display: flex; align-items: flex-start; gap: 6px; }
.rush-countdown-slot { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.rush-countdown-unit {
  font-size: 9.5px;
  font-weight: 450;
  letter-spacing: .01em;
  color: var(--rush-ink-faint);
  transition: color 260ms ease;
}
.rush-countdown[data-urgent="true"] .rush-countdown-unit { color: var(--rush-urgent-ink); }
.rush-cell {
  font-family: var(--rush-font-display);
  width: 34px;
  height: 34px;
  border-radius: var(--rush-radius-control);
  background: var(--rush-secondary);
  color: var(--rush-on-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 14px;
  font-weight: 550;
  letter-spacing: -.01em;
  font-variant-numeric: tabular-nums;
  background-image: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,0) 50%);
}
.rush-roll { display: inline-flex; align-items: center; line-height: 1; font-variant-numeric: tabular-nums; }
.rush-roll-digit { display: inline-block; height: 1em; overflow: hidden; vertical-align: top; }
.rush-roll-strip {
  display: flex;
  flex-direction: column;
  transform: translateY(calc(var(--rush-roll, 0) * -1em));
  transition: transform 700ms cubic-bezier(.16,1,.3,1);
  will-change: transform;
}
.rush-roll-cell { display: flex; align-items: center; justify-content: center; height: 1em; line-height: 1; }

.rush-product {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--rush-wash);
  border: 1px solid var(--rush-hairline);
  border-radius: var(--rush-radius-surface);
  padding: 10px;
  margin-top: 10px;
}
.rush-product[data-paged="true"] { padding-right: 60px; }
.rush-media {
  width: 64px;
  height: 64px;
  border-radius: var(--rush-radius-control);
  overflow: hidden;
  background: rgba(17,17,19,.06);
  flex: none;
  position: relative;
  box-shadow: inset 0 0 0 1px var(--rush-hairline);
}
.rush-media img, .rush-media video { width: 100%; height: 100%; object-fit: cover; display: none; }
.rush-media[data-state="image"] img { display: block; }
.rush-media[data-state="video"] video { display: block; }
.rush-product-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.rush-product-name {
  font-size: 13px;
  font-weight: 450;
  line-height: 1.35;
  color: var(--rush-ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rush-prices { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 8px; }
.rush-old { font-size: 12px; font-weight: 400; color: var(--rush-ink-faint); text-decoration: line-through; order: 2; }
.rush-new {
  font-family: var(--rush-font-display);
  font-size: 19px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -.02em;
  color: var(--rush-ink);
  order: 1;
}
.rush-prices[data-discounted="true"] .rush-new { color: var(--rush-sale); }
.rush-save {
  display: none;
  font-size: 11.5px;
  font-weight: 450;
  line-height: 1.4;
  color: var(--rush-ink-faint);
  white-space: nowrap;
  order: 3;
}
.rush-prices[data-discounted="true"] .rush-save { display: inline; }

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

.rush-variant-groups { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; min-width: 0; }
.rush-variant-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.rush-variant-group-label {
  font-size: 12px;
  font-weight: 450;
  letter-spacing: -.005em;
  color: var(--rush-ink-soft);
}
.rush-variant-scroller { position: relative; display: flex; align-items: center; min-width: 0; }
.rush-variants {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 2px;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}
.rush-variants::-webkit-scrollbar { display: none; }
.rush-variants {
  --rush-fade-start: 0px;
  --rush-fade-end: 0px;
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 var(--rush-fade-start), #000 calc(100% - var(--rush-fade-end)), transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, #000 var(--rush-fade-start), #000 calc(100% - var(--rush-fade-end)), transparent 100%);
}
.rush-variant-scroller[data-at-start="false"] .rush-variants { --rush-fade-start: 30px; }
.rush-variant-scroller[data-at-end="false"] .rush-variants { --rush-fade-end: 30px; }
.rush-variant-scroll {
  position: absolute;
  top: calc(50% - 1px);
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  padding: 0;
  z-index: 1;
  border: 1px solid #E5E5E5;
  border-radius: 50%;
  background: #fff;
  color: #0A0A0A;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 5px rgba(0,0,0,.14);
  transition: opacity 160ms ease, background-color 160ms ease;
}
.rush-variant-scroll svg { width: 13px; height: 13px; }
.rush-variant-scroll[data-direction="previous"] { left: 0; }
.rush-variant-scroll[data-direction="next"] { right: 0; }
.rush-variant-scroll[data-direction="next"] svg { transform: rotate(180deg); }
.rush-variant-scroller[data-overflow="true"] .rush-variant-scroll { display: flex; }
.rush-variant-scroll[disabled] { opacity: 0; pointer-events: none; }
.rush-variant {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  max-width: 100%;
  min-height: 26px;
  border: 1px solid var(--rush-hairline);
  background: var(--rush-wash);
  border-radius: var(--rush-radius-pill);
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 450;
  cursor: pointer;
  white-space: nowrap;
  color: var(--rush-ink-soft);
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease, transform 120ms ease;
}
.rush-variant:active:not([disabled]) { transform: scale(.96); }
.rush-variant[aria-pressed="true"] {
  background: var(--rush-accent-glass);
  border-color: var(--rush-accent-line);
  color: var(--rush-accent-ink);
  font-weight: 550;
}
.rush-variant:focus-visible { outline: 2px solid var(--rush-accent); outline-offset: 2px; }

.rush-variant[disabled] { text-decoration: line-through; opacity: .45; cursor: not-allowed; }
.rush-variant-dot {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #E5E5E5 center/cover no-repeat;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.12);
  transition: transform 220ms cubic-bezier(.34,1.4,.64,1);
}
.rush-variant[aria-pressed="true"] .rush-variant-dot { transform: scale(1.08); box-shadow: inset 0 0 0 1px rgba(0,0,0,.16); }
.rush-variant-dot[data-blank="true"] { background: repeating-linear-gradient(45deg, #E5E5E5 0 3px, #F5F5F5 3px 6px); }
.rush-variant-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.rush-variant-group[data-selection="color"] .rush-variant { padding: 3px 10px 3px 4px; }

.rush-cta {
  font-family: var(--rush-font-display);
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 48px;
  margin-top: 16px;
  border: 1.5px solid transparent;
  border-radius: var(--rush-radius-control);
  background: var(--rush-accent);
  color: var(--rush-on-accent);
  font-size: 14px;
  font-weight: 550;
  letter-spacing: -.005em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 0 0 1px var(--rush-accent-line), 0 4px 14px rgba(15,15,15,.1);
  transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease, transform 140ms ease;
}
.rush-cta:active:not([disabled]) { transform: scale(.99); }
.rush-cta::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 38%, var(--rush-sheen) 50%, transparent 62%);
  transform: translateX(-110%);
  pointer-events: none;
}
.rush-cta:focus-visible { outline: 2px solid var(--rush-accent); outline-offset: 2px; }
.rush-root[data-cta] .rush-cta[data-state="success"] { background: #30A46C; border-color: transparent; color: #FFFFFF; box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 0 0 1px rgba(38,128,86,.5); }
.rush-root[data-cta] .rush-cta[data-state="error"],
.rush-root[data-cta] .rush-cta[data-state="retry"] { background: rgba(255,255,255,.7); border-color: transparent; color: #C7362F; box-shadow: 0 0 0 1px rgba(199,54,47,.45); }

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
  .rush-tab:hover { opacity: 1; }
  .rush-nav:hover:not([disabled]) { color: #0A0A0A; }
  .rush-nav[data-direction="previous"]:hover:not([disabled]) { transform: translateX(-2px); }
  .rush-nav[data-direction="next"]:hover:not([disabled]) { transform: translateX(2px); }
  .rush-variant:hover:not([disabled]) { border-color: #A3A3A3; }
  .rush-variant-scroll:hover:not([disabled]) { background: #F5F5F5; }
  .rush-close:hover { color: #0A0A0A; transform: rotate(90deg); }
  .rush-cart-link:hover { background: var(--rush-accent-soft-hover); }
}

@keyframes rush-sheen {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(110%); }
}

/* State + selection colors must outrank every hover/active rule above. */
.rush-root[data-cta] .rush-cta[data-state="success"]:hover:not([disabled]),
.rush-root[data-cta] .rush-cta[data-state="success"]:active:not([disabled]) {
  background: #15803D;
  border-color: #15803D;
  color: #FFFFFF;
}
.rush-root[data-cta] .rush-cta[data-state="error"]:hover:not([disabled]),
.rush-root[data-cta] .rush-cta[data-state="error"]:active:not([disabled]),
.rush-root[data-cta] .rush-cta[data-state="retry"]:hover:not([disabled]),
.rush-root[data-cta] .rush-cta[data-state="retry"]:active:not([disabled]) {
  background: #FEF2F2;
  border-color: #B91C1C;
  color: #B91C1C;
}
.rush-variant[aria-pressed="true"]:hover:not([disabled]),
.rush-variant[aria-pressed="true"]:active:not([disabled]) { border-color: var(--rush-accent); }

.rush-cta:active:not([disabled]) { background-color: var(--rush-accent-active); }
.rush-cta[disabled] { cursor: not-allowed; }
.rush-cta[data-state="soldout"] { opacity: .5; }
.rush-cta[aria-busy="true"] { opacity: .85; }

.rush-error { margin-top: 8px; font-size: 12px; font-weight: 450; color: #C7362F; text-align: center; }
.rush-tab:focus-visible, .rush-close:focus-visible, .rush-nav:focus-visible, .rush-variant-scroll:focus-visible {
  outline: 2px solid var(--rush-accent);
  outline-offset: 2px;
}

.rush-dots { display: inline-flex; gap: 4px; }
.rush-dots span { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: rush-blink 1s infinite; }
.rush-dots span:nth-child(2) { animation-delay: .15s; }
.rush-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes rush-blink { 0%, 60%, 100% { opacity: .45; } 30% { opacity: 1; } }

.rush-ended { margin-top: 16px; font-size: 13px; color: var(--rush-ink-soft); text-align: center; }

@media (prefers-reduced-motion: reduce) {
  .rush-panel, .rush-cta, .rush-variant, .rush-nav, .rush-close, .rush-tab, .rush-variant-dot, .rush-roll-strip, .rush-variant-scroll { transition: none; }
  .rush-variants { scroll-behavior: auto; }
  .rush-cta::after { animation: none; }
  .rush-close:hover, .rush-nav:hover:not([disabled]), .rush-variant:active:not([disabled]) { transform: none; }
  .rush-dots span { animation: none; opacity: 1; }
  .rush-countdown[data-urgent="true"] .rush-cell { animation: none; }
}

@media (max-width: 640px) {
  .rush-panel { width: calc(100vw - 56px); max-width: 360px; padding: 18px 16px; }
  .rush-close { top: 10px; right: 10px; width: 32px; height: 32px; font-size: 20px; }
  .rush-headline { padding-right: 32px; }
  .rush-product[data-paged="true"] { padding-right: 74px; }
  .rush-nav { width: 34px; height: 34px; }
  .rush-variant { min-height: 40px; padding: 8px 14px; font-size: 13px; }
  .rush-variant-scroll { width: 28px; height: 28px; }
  .rush-cta { min-height: 52px; }
}
`;

const SYSTEM_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function themeStack(): string {
  try {
    const inherited = getComputedStyle(document.body).fontFamily;
    return inherited ? `${inherited}, ${SYSTEM_STACK}` : SYSTEM_STACK;
  } catch {
    return SYSTEM_STACK;
  }
}

function fontStacks(useThemeFont: boolean): { body: string; display: string } {
  if (useThemeFont) {
    const stack = themeStack();
    return { body: stack, display: stack };
  }

  return {
    body: `'Rush General Sans', ${SYSTEM_STACK}`,
    display: `'Rush General Sans', ${SYSTEM_STACK}`,
  };
}

export function applyAppearanceVars(host: HTMLElement, appearance: Appearance): void {
  const { accentColor, secondaryColor } = appearance;
  const fonts = fontStacks(appearance.useThemeFont);
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
    '--rush-sale': appearance.salePriceColor,
    '--rush-on-secondary': readableOn(secondaryColor),
    '--rush-accent-glow': alpha(accentColor, 0.22),
    '--rush-accent-glass': alpha(accentColor, 0.07),
    '--rush-accent-line': alpha(accentColor, 0.32),
    '--rush-glass-panel': 'rgba(253,253,254,.76)',
    '--rush-wash': 'rgba(17,17,19,.05)',
    '--rush-hairline': 'rgba(17,17,19,.08)',
    '--rush-hairline-light': 'rgba(255,255,255,.34)',
    '--rush-ink': 'rgba(17,17,19,.92)',
    '--rush-ink-soft': 'rgba(17,17,19,.6)',
    '--rush-ink-faint': 'rgba(17,17,19,.38)',
    '--rush-urgent': '#D93E36',
    '--rush-urgent-soft': 'rgba(217,62,54,.08)',
    '--rush-urgent-ink': '#B4342D',
    '--rush-sheen': onAccent === '#FFFFFF' ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.12)',
    '--rush-radius-tab': `${appearance.tabRadius}px`,
    '--rush-radius-panel': `${radius.panel}px`,
    '--rush-radius-surface': `${radius.surface}px`,
    '--rush-radius-control': `${radius.control}px`,
    '--rush-radius-pill': radius.pill,
    '--rush-font-body': fonts.body,
    '--rush-font-display': fonts.display,
  };

  for (const [name, value] of Object.entries(vars)) host.style.setProperty(name, value);
  host.setAttribute('data-cta', appearance.ctaStyle);
}
