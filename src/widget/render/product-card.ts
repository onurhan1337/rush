import type { WidgetVariant } from '@/lib/campaigns/widget-types';
import { el, formatMoney } from './dom';

export type ProductCard = {
  node: HTMLElement;
  update: (variant: WidgetVariant) => void;
};

export function createProductCard(productName: string, currencySymbol: string, variant: WidgetVariant): ProductCard {
  const node = el('div', 'rush-product');

  const image = el('img');
  image.loading = 'lazy';
  image.alt = productName;
  node.appendChild(image);

  const info = el('div', 'rush-product-info');
  const name = el('div', 'rush-product-name', productName);
  const prices = el('div', 'rush-prices');
  const oldPrice = el('span', 'rush-old');
  const newPrice = el('span', 'rush-new');
  prices.appendChild(oldPrice);
  prices.appendChild(newPrice);
  info.appendChild(name);
  info.appendChild(prices);
  node.appendChild(info);

  const update = (next: WidgetVariant) => {
    if (next.imageUrl) image.src = next.imageUrl;
    image.style.display = next.imageUrl ? '' : 'none';
    oldPrice.textContent = next.sellPrice > next.offerPrice ? formatMoney(next.sellPrice, currencySymbol) : '';
    newPrice.textContent = formatMoney(next.offerPrice, currencySymbol);
  };

  update(variant);

  return { node, update };
}
