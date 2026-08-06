import { z } from 'zod';
import { DEFAULT_APPEARANCE, type Appearance } from './appearance';

export const mountTargetSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('fixed'), side: z.enum(['left', 'right']) }),
  z.object({ mode: z.literal('selector'), selector: z.string().min(1), position: z.enum(['before', 'after', 'append']) }),
]);

export const appearanceSchema = z.object({
  mount: mountTargetSchema.default(DEFAULT_APPEARANCE.mount),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Geçerli bir hex renk girin')
    .default(DEFAULT_APPEARANCE.accentColor),
  radius: z.union([z.literal(0), z.literal(8), z.literal(16)]).default(DEFAULT_APPEARANCE.radius),
  icon: z.enum(['clock', 'gift', 'bolt', 'none']).default(DEFAULT_APPEARANCE.icon),
  autoOpen: z.boolean().default(DEFAULT_APPEARANCE.autoOpen),
  autoOpenDelaySec: z.number().int().min(0).max(60).default(DEFAULT_APPEARANCE.autoOpenDelaySec),
});

const _typeCheck: Appearance = {} as z.infer<typeof appearanceSchema>;
void _typeCheck;
