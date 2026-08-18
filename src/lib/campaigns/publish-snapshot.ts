import crypto from 'crypto';
import { DEFAULT_APPEARANCE, type Appearance } from './appearance';
import { EMPTY_RULE_SET, type RuleSet } from './rules/types';
import type { Campaign } from '@/models/campaign';

export type PublishSnapshot = {
  type: string;
  name: string;
  startsAt?: string;
  endsAt?: string;
  config: Record<string, unknown>;
  rules: RuleSet;
  appearance: Appearance;
  priority: number;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));

  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

export function buildSnapshot(campaign: Campaign): PublishSnapshot {
  return {
    type: campaign.type,
    name: campaign.name,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    config: campaign.config,
    rules: campaign.rules,
    appearance: campaign.appearance,
    priority: campaign.priority,
  };
}

export function snapshotVersion(snapshot: PublishSnapshot): string {
  return crypto.createHash('sha1').update(stableStringify(snapshot)).digest('hex').slice(0, 12);
}

export function readSnapshot(raw: string | null | undefined): PublishSnapshot | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    const snapshot = parsed as Partial<PublishSnapshot>;
    if (typeof snapshot.type !== 'string' || !snapshot.config || typeof snapshot.config !== 'object') return undefined;

    return {
      type: snapshot.type,
      name: typeof snapshot.name === 'string' ? snapshot.name : '',
      startsAt: typeof snapshot.startsAt === 'string' ? snapshot.startsAt : undefined,
      endsAt: typeof snapshot.endsAt === 'string' ? snapshot.endsAt : undefined,
      config: snapshot.config as Record<string, unknown>,
      rules: snapshot.rules ?? EMPTY_RULE_SET,
      appearance: { ...DEFAULT_APPEARANCE, ...(snapshot.appearance ?? {}) },
      priority: typeof snapshot.priority === 'number' ? snapshot.priority : 0,
    };
  } catch {
    return undefined;
  }
}

export function snapshotToCampaign(campaign: Campaign, snapshot: PublishSnapshot): Campaign {
  return {
    ...campaign,
    type: snapshot.type,
    name: snapshot.name || campaign.name,
    startsAt: snapshot.startsAt,
    endsAt: snapshot.endsAt,
    config: snapshot.config,
    rules: snapshot.rules,
    appearance: snapshot.appearance,
    priority: snapshot.priority,
  };
}

export function hasUnpublishedChanges(campaign: Campaign): boolean {
  if (campaign.status !== 'ACTIVE') return false;
  if (!campaign.publishedVersion) return true;
  return snapshotVersion(buildSnapshot(campaign)) !== campaign.publishedVersion;
}
