import { formatMoney as format, type Currency } from '@/lib/money';

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function storefrontLocale(): string {
  return document.documentElement.getAttribute('lang') || navigator.language || 'tr-TR';
}

export function formatMoney(amount: number, currency: Currency): string {
  return format(amount, currency, storefrontLocale());
}
