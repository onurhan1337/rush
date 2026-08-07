import { z } from 'zod';
import { appearanceSchema } from './appearance-schema';
import { ruleSetSchema } from './rules/schema';
import { getCampaignType } from './registry';

export const campaignWriteSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1, 'Kampanya adı zorunlu').max(80),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).default('DRAFT'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  config: z.record(z.unknown()).default({}),
  rules: ruleSetSchema.default({ match: 'all', conditions: [] }),
  appearance: appearanceSchema.partial().default({}),
  priority: z.number().int().min(0).max(100).default(0),
});

export const campaignPatchSchema = campaignWriteSchema.partial();

export type CampaignWriteInput = z.infer<typeof campaignWriteSchema>;

export function parseCampaignConfig(type: string, config: unknown): { ok: true; config: unknown } | { ok: false; error: string } {
  const definition = getCampaignType(type);
  if (!definition) return { ok: false, error: `Bilinmeyen kampanya tipi: ${type}` };

  const result = definition.configSchema.safeParse(config);
  if (!result.success) {
    return { ok: false, error: result.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ') };
  }
  return { ok: true, config: result.data };
}
