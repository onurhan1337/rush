const SWATCH_COLORS: Record<string, string> = {
  siyah: '#111111',
  black: '#111111',
  beyaz: '#FFFFFF',
  white: '#FFFFFF',
  gri: '#9CA3AF',
  grey: '#9CA3AF',
  gray: '#9CA3AF',
  antrasit: '#3F3F46',
  kirmizi: '#DC2626',
  red: '#DC2626',
  bordo: '#7F1D1D',
  burgundy: '#7F1D1D',
  pembe: '#F472B6',
  pink: '#F472B6',
  turuncu: '#F97316',
  orange: '#F97316',
  sari: '#FACC15',
  yellow: '#FACC15',
  yesil: '#16A34A',
  green: '#16A34A',
  haki: '#4D5D3A',
  khaki: '#4D5D3A',
  mavi: '#2563EB',
  blue: '#2563EB',
  lacivert: '#1E293B',
  navy: '#1E293B',
  turkuaz: '#06B6D4',
  turquoise: '#06B6D4',
  mor: '#7C3AED',
  purple: '#7C3AED',
  lila: '#C4B5FD',
  kahverengi: '#78462A',
  brown: '#78462A',
  bej: '#E4D5B7',
  beige: '#E4D5B7',
  krem: '#F5EFE0',
  cream: '#F5EFE0',
  ekru: '#EFE7D8',
  vizon: '#B7A296',
  gold: '#D4AF37',
  altin: '#D4AF37',
  silver: '#C0C0C0',
  gumus: '#C0C0C0',
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z]/g, '');
}

export function swatchColor(label: string | undefined): string | undefined {
  if (!label) return undefined;

  for (const part of label.split('/')) {
    const color = SWATCH_COLORS[normalize(part)];
    if (color) return color;
  }

  return undefined;
}
