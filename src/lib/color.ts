export type Rgb = { r: number; g: number; b: number };

const HEX = /^#?([0-9a-fA-F]{6})$/;

export function parseHex(value: string): Rgb | undefined {
  const match = HEX.exec(value.trim());
  if (!match) return undefined;

  const int = parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function toHex({ r, g, b }: Rgb): string {
  const channel = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function channelLuminance(value: number): number {
  const ratio = value / 255;
  return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
}

export function luminance(color: Rgb): number {
  return 0.2126 * channelLuminance(color.r) + 0.7152 * channelLuminance(color.g) + 0.0722 * channelLuminance(color.b);
}

export function readableOn(background: string): string {
  const color = parseHex(background);
  if (!color) return '#FFFFFF';
  return luminance(color) > 0.45 ? '#0A0A0A' : '#FFFFFF';
}

export function mix(from: string, to: string, weight: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  if (!a || !b) return from;

  const ratio = Math.min(1, Math.max(0, weight));
  return toHex({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  });
}

export function tint(color: string, weight: number): string {
  return mix(color, '#FFFFFF', weight);
}

export function shade(color: string, weight: number): string {
  return mix(color, '#000000', weight);
}

export function hover(color: string): string {
  const parsed = parseHex(color);
  if (!parsed) return color;
  return luminance(parsed) > 0.45 ? shade(color, 0.12) : tint(color, 0.16);
}

export function alpha(color: string, value: number): string {
  const parsed = parseHex(color);
  if (!parsed) return color;
  const clamped = Math.min(1, Math.max(0, value));
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${clamped})`;
}
