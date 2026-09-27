import { initKancaStorefront } from '@kanca-app/ikas/storefront';

// Replaced at build time by scripts/build-widget.mjs.
declare const __KANCA_PUBLIC_KEY__: string;
declare const __KANCA_ENDPOINT__: string;
declare const __RUSH_RELEASE__: string;

// Must run synchronously while rush.js first executes (document.currentScript).
const preview = document.currentScript?.getAttribute('data-rush-preview') === '1';

export const kanca = initKancaStorefront({
  // The dashboard preview iframe is not a real storefront page view.
  publicKey: preview ? undefined : __KANCA_PUBLIC_KEY__ || undefined,
  endpoint: __KANCA_ENDPOINT__ || undefined,
  scriptName: 'rush',
  scriptUrlMatch: '/rush.js',
  release: __RUSH_RELEASE__ || undefined,
});
