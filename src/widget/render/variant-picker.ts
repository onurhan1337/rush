import type { ResolvedVariantType, ResolvedVariantValue } from '@/lib/campaigns/variant-types';
import type { WidgetVariant } from '@/lib/campaigns/widget-types';
import { el } from './dom';

export type VariantPicker = {
  node: HTMLElement;
  selected: () => WidgetVariant;
};

type Options = {
  variants: WidgetVariant[];
  types: ResolvedVariantType[];
  initial: WidgetVariant;
  onChange: (variant: WidgetVariant) => void;
};

type Choice = Record<string, string>;

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

export function createVariantPicker({ variants, types, initial, onChange }: Options): VariantPicker | null {
  if (variants.length < 2 || !types.length) return null;

  const node = el('div', 'rush-variant-groups');
  let choice = choiceOf(initial);
  let current = initial;

  const entries: Array<{ button: HTMLButtonElement; typeId: string; valueId: string }> = [];

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

    const list = el('div', 'rush-variants');
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
      list.appendChild(button);
    }

    group.appendChild(list);
    node.appendChild(group);
  }

  sync();

  return { node, selected: () => current };
}
