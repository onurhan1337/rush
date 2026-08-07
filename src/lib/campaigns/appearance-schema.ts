import { z } from 'zod';
import { APPEARANCE_ICONS, CTA_STYLES, DEFAULT_APPEARANCE, RADII, type Appearance } from './appearance';

export const mountTargetSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('fixed'), side: z.enum(['left', 'right']) }),
  z.object({ mode: z.literal('selector'), selector: z.string().min(1), position: z.enum(['before', 'after', 'append']) }),
]);

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Geçerli bir hex renk girin');

const radiusValue = z.union([
  z.literal(RADII[0]),
  z.literal(RADII[1]),
  z.literal(RADII[2]),
  z.literal(RADII[3]),
  z.literal(RADII[4]),
]);

export const appearanceSchema = z.object({
  mount: mountTargetSchema.default(DEFAULT_APPEARANCE.mount),
  accentColor: hexColor.default(DEFAULT_APPEARANCE.accentColor),
  secondaryColor: hexColor.default(DEFAULT_APPEARANCE.secondaryColor),
  salePriceColor: hexColor.default(DEFAULT_APPEARANCE.salePriceColor),
  radius: radiusValue.default(DEFAULT_APPEARANCE.radius),
  tabRadius: radiusValue.default(DEFAULT_APPEARANCE.tabRadius),
  icon: z.enum(APPEARANCE_ICONS).default(DEFAULT_APPEARANCE.icon),
  ctaStyle: z.enum(CTA_STYLES).default(DEFAULT_APPEARANCE.ctaStyle),
  autoOpen: z.boolean().default(DEFAULT_APPEARANCE.autoOpen),
  autoOpenDelaySec: z.number().int().min(0).max(60).default(DEFAULT_APPEARANCE.autoOpenDelaySec),
});

const _typeCheck: Appearance = {} as z.infer<typeof appearanceSchema>;
void _typeCheck;
