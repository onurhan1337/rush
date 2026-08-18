type FontSpec = { family: string; file: string };

const FONTS: FontSpec[] = [{ family: 'Rush General Sans', file: 'general-sans-variable.woff2' }];

const WEIGHT_RANGE = '200 700';

let assetOrigin = '';
let requested = false;

export function setAssetOrigin(origin: string): void {
  assetOrigin = origin;
}

export function loadWidgetFonts(): void {
  if (requested || !assetOrigin) return;
  requested = true;

  if (typeof FontFace !== 'function' || !document.fonts) return;

  for (const font of FONTS) {
    try {
      const face = new FontFace(font.family, `url(${assetOrigin}/fonts/${font.file}) format('woff2')`, {
        weight: WEIGHT_RANGE,
        style: 'normal',
        display: 'swap',
      });

      face
        .load()
        .then((ready) => document.fonts.add(ready))
        .catch(() => undefined);
    } catch {
      continue;
    }
  }
}
