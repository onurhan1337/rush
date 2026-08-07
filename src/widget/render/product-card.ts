import type { WidgetProduct, WidgetVariant } from '@/lib/campaigns/widget-types';
import { el, formatMoney } from './dom';

export type ProductCard = {
  node: HTMLElement;
  update: (variant: WidgetVariant) => void;
};

function createMediaSlot(productName: string) {
  const node = el('div', 'rush-media');
  node.setAttribute('data-state', 'empty');

  const image = el('img');
  image.loading = 'lazy';
  image.decoding = 'async';
  image.sizes = '72px';
  image.alt = productName;
  image.addEventListener('error', () => node.setAttribute('data-state', 'empty'));

  const video = el('video');
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', productName);
  video.addEventListener('error', () => node.setAttribute('data-state', 'empty'));

  node.appendChild(image);
  node.appendChild(video);

  const update = ({ media }: WidgetVariant) => {
    if (!media) {
      node.setAttribute('data-state', 'empty');
      video.removeAttribute('src');
      return;
    }

    node.setAttribute('data-state', media.isVideo ? 'video' : 'image');

    if (media.isVideo) {
      image.removeAttribute('srcset');
      image.removeAttribute('src');
      if (video.src !== media.url) video.src = media.url;
      return;
    }

    video.removeAttribute('src');
    if (media.srcSet) image.srcset = media.srcSet;
    image.src = media.url;
  };

  return { node, update };
}

export function createProductCard(product: WidgetProduct, variant: WidgetVariant): ProductCard {
  const node = el('div', 'rush-product');

  const media = createMediaSlot(product.name);
  node.appendChild(media.node);

  const info = el('div', 'rush-product-info');
  const name = el('div', 'rush-product-name', product.name);
  const prices = el('div', 'rush-prices');
  const oldPrice = el('span', 'rush-old');
  const newPrice = el('span', 'rush-new');
  prices.appendChild(oldPrice);
  prices.appendChild(newPrice);
  info.appendChild(name);
  info.appendChild(prices);
  node.appendChild(info);

  const update = (next: WidgetVariant) => {
    media.update(next);
    oldPrice.textContent = next.sellPrice > next.offerPrice ? formatMoney(next.sellPrice, product.currency) : '';
    newPrice.textContent = formatMoney(next.offerPrice, product.currency);
  };

  update(variant);

  return { node, update };
}
