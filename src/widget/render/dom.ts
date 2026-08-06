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

export function formatMoney(amount: number, currencySymbol: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = rounded.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currencySymbol ? `${formatted} ${currencySymbol}` : formatted;
}
