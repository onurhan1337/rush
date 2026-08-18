import type { ResolvedVariantType, ResolvedVariantValue } from '@/lib/campaigns/variant-types';
import type { WidgetVariant } from '@/lib/campaigns/widget-types';
import { el } from './dom';

export type VariantPicker = {
  node: HTMLElement;
  selected: () => WidgetVariant;
  destroy: () => void;
};

type Options = {
  variants: WidgetVariant[];
  types: ResolvedVariantType[];
  initial: WidgetVariant;
  onChange: (variant: WidgetVariant) => void;
};

type Choice = Record<string, string>;

const CHEVRON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

const EDGE_TOLERANCE = 2;

function choiceOf(variant: WidgetVariant): Choice {
  const choice: Choice = {};
  for (const option of variant.options) choice[option.typeId] = option.valueId;
  return choice;
}

function matches(variant: WidgetVariant, choice: Choice): boolean {
  return Object.keys(choice).every((typeId) => variant.options.some((option) => option.typeId === typeId && option.valueId === choice[typeId]));
}

function findVariant(variants: WidgetVariant[], choice: Choice): WidgetVariant | undefined {
  const candidates = variants.filter((variant) => matches(variant, choice));
  return candidates.find((variant) => variant.inStock) ?? candidates[0];
}

function selectValue(variants: WidgetVariant[], choice: Choice, typeId: string, valueId: string) {
  const next = { ...choice, [typeId]: valueId };
  const direct = findVariant(variants, next);
  if (direct) return { choice: next, variant: direct };

  const fallback = findVariant(variants, { [typeId]: valueId });
  return fallback ? { choice: choiceOf(fallback), variant: fallback } : null;
}

function paintSwatch(node: HTMLElement, value: ResolvedVariantValue): void {
  if (value.media && !value.media.isVideo) node.style.backgroundImage = `url("${value.media.url}")`;
  else if (value.colorCode) node.style.background = value.colorCode;
  else node.setAttribute('data-blank', 'true');
}

function createValueButton(type: ResolvedVariantType, value: ResolvedVariantValue): HTMLButtonElement {
  const button = el('button', 'rush-variant');
  button.type = 'button';
  button.setAttribute('aria-label', `${type.name}: ${value.name}`);

  if (type.selectionType === 'color') {
    const dot = el('span', 'rush-variant-dot');
    paintSwatch(dot, value);
    button.appendChild(dot);
  }

  button.appendChild(el('span', 'rush-variant-label', value.name));
  return button;
}

function createScrollButton(direction: 'previous' | 'next', label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', 'rush-variant-scroll');
  button.type = 'button';
  button.tabIndex = -1;
  button.setAttribute('aria-hidden', 'true');
  button.setAttribute('aria-label', label);
  button.setAttribute('data-direction', direction);
  button.innerHTML = CHEVRON;
  button.addEventListener('click', onClick);
  return button;
}

type Scroller = {
  node: HTMLElement;
  list: HTMLElement;
  sync: () => void;
  destroy: () => void;
};

function createScroller(typeName: string): Scroller {
  const node = el('div', 'rush-variant-scroller');
  node.setAttribute('data-overflow', 'false');
  node.setAttribute('data-at-start', 'true');
  node.setAttribute('data-at-end', 'true');

  const list = el('div', 'rush-variants');

  const step = () => Math.max(Math.round(list.clientWidth * 0.8), 96);
  const previous = createScrollButton('previous', `${typeName}: önceki`, () => list.scrollBy({ left: -step() }));
  const next = createScrollButton('next', `${typeName}: sonraki`, () => list.scrollBy({ left: step() }));

  node.appendChild(previous);
  node.appendChild(list);
  node.appendChild(next);

  const sync = () => {
    const max = list.scrollWidth - list.clientWidth;
    const overflowing = max > EDGE_TOLERANCE;
    const atStart = !overflowing || list.scrollLeft <= EDGE_TOLERANCE;
    const atEnd = !overflowing || list.scrollLeft >= max - EDGE_TOLERANCE;

    node.setAttribute('data-overflow', overflowing ? 'true' : 'false');
    node.setAttribute('data-at-start', atStart ? 'true' : 'false');
    node.setAttribute('data-at-end', atEnd ? 'true' : 'false');
    previous.disabled = atStart;
    next.disabled = atEnd;
  };

  list.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);

  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => sync()) : null;
  if (observer) observer.observe(list);

  const frame = requestAnimationFrame(sync);

  return {
    node,
    list,
    sync,
    destroy: () => {
      cancelAnimationFrame(frame);
      list.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      if (observer) observer.disconnect();
    },
  };
}

export function createVariantPicker({ variants, types, initial, onChange }: Options): VariantPicker | null {
  if (variants.length < 2 || !types.length) return null;

  const node = el('div', 'rush-variant-groups');
  let choice = choiceOf(initial);
  let current = initial;

  const entries: Array<{ button: HTMLButtonElement; typeId: string; valueId: string }> = [];
  const scrollers: Scroller[] = [];

  const sync = () => {
    for (const entry of entries) {
      entry.button.setAttribute('aria-pressed', choice[entry.typeId] === entry.valueId ? 'true' : 'false');
    }
  };

  for (const type of types) {
    const group = el('div', 'rush-variant-group');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', type.name);
    group.setAttribute('data-selection', type.selectionType);

    group.appendChild(el('span', 'rush-variant-group-label', type.name));

    const scroller = createScroller(type.name);
    scrollers.push(scroller);

    for (const value of type.values) {
      const button = createValueButton(type, value);
      button.disabled = !variants.some((variant) => matches(variant, { [type.id]: value.id }) && variant.inStock);
      button.addEventListener('click', () => {
        const next = selectValue(variants, choice, type.id, value.id);
        if (!next) return;
        choice = next.choice;
        current = next.variant;
        sync();
        onChange(next.variant);
      });
      entries.push({ button, typeId: type.id, valueId: value.id });
      scroller.list.appendChild(button);
    }

    group.appendChild(scroller.node);
    node.appendChild(group);
  }

  sync();

  return {
    node,
    selected: () => current,
    destroy: () => {
      for (const scroller of scrollers) scroller.destroy();
    },
  };
}
