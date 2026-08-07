export type MountTarget =
  | { mode: 'fixed'; side: 'left' | 'right' }
  | { mode: 'selector'; selector: string; position: 'before' | 'after' | 'append' };

export const APPEARANCE_ICONS = ['clock', 'gift', 'bolt', 'flame', 'tag', 'sparkle', 'percent', 'star', 'cart', 'crown', 'none'] as const;

export type AppearanceIcon = (typeof APPEARANCE_ICONS)[number];

export const CTA_STYLES = ['solid', 'gradient', 'outline', 'soft'] as const;

export type CtaStyle = (typeof CTA_STYLES)[number];

export const RADII = [0, 8, 12, 16, 24] as const;

export type Radius = (typeof RADII)[number];

export type Appearance = {
  mount: MountTarget;
  accentColor: string;
  secondaryColor: string;
  radius: Radius;
  tabRadius: Radius;
  icon: AppearanceIcon;
  ctaStyle: CtaStyle;
  autoOpen: boolean;
  autoOpenDelaySec: number;
};

export const DEFAULT_APPEARANCE: Appearance = {
  mount: { mode: 'fixed', side: 'left' },
  accentColor: '#0A0A0A',
  secondaryColor: '#0A0A0A',
  radius: 16,
  tabRadius: 16,
  icon: 'clock',
  ctaStyle: 'solid',
  autoOpen: false,
  autoOpenDelaySec: 3,
};

export type RadiusScale = {
  panel: number;
  surface: number;
  control: number;
  pill: string;
};

export function radiusScale(radius: number): RadiusScale {
  if (radius <= 0) return { panel: 0, surface: 0, control: 0, pill: '0px' };

  return {
    panel: radius + 4,
    surface: Math.round(radius * 0.75),
    control: Math.round(radius * 0.65),
    pill: '999px',
  };
}
