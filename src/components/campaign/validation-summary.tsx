'use client';

import type { FieldErrors } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { CampaignFormValues } from './types';

const FIELD_LABELS: Record<string, TranslationKey> = {
  name: 'basics.name',
  startsAt: 'basics.startsAt',
  endsAt: 'basics.endsAt',
  'config.productId': 'product.search',
  'config.variantIds': 'product.variants',
  'config.offerPrice': 'pricing.offerPrice',
  'config.quantity': 'pricing.quantity',
  'config.countdown': 'countdown.title',
  'config.countdown.endsAt': 'countdown.endsAt',
  'config.countdown.durationSec': 'countdown.duration',
  'config.headline': 'content.headline',
  'config.subtitle': 'content.subtitle',
  'config.ctaLabel': 'content.cta',
  'config.tabLabel': 'content.tabLabel',
  'appearance.accentColor': 'appearance.accent',
  'appearance.radius': 'appearance.radius',
  'appearance.icon': 'appearance.icon',
  rules: 'rules.title',
};

type Issue = { path: string; message: string };

function collect(errors: unknown, prefix = '', out: Issue[] = []): Issue[] {
  if (!errors || typeof errors !== 'object') return out;

  const node = errors as Record<string, unknown> & { message?: unknown };

  if (typeof node.message === 'string' && node.message) {
    out.push({ path: prefix, message: node.message });
    return out;
  }

  for (const key of Object.keys(node)) {
    if (key === 'ref' || key === 'type' || key === 'types') continue;
    collect(node[key], prefix ? `${prefix}.${key}` : key, out);
  }

  return out;
}

export function ValidationSummary({ errors }: { errors: FieldErrors<CampaignFormValues> }) {
  const t = useT();
  const issues = collect(errors);

  if (!issues.length) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="size-4" />
      <AlertTitle>{t('validation.title')}</AlertTitle>
      <AlertDescription>
        <ul className="mt-1 flex flex-col gap-1">
          {issues.map((issue) => {
            const labelKey = FIELD_LABELS[issue.path] ?? FIELD_LABELS[issue.path.replace(/\.\d+$/, '')];
            return (
              <li key={issue.path} className="text-xs">
                <span className="font-medium">{labelKey ? t(labelKey) : issue.path}</span>
                {' — '}
                {issue.message}
              </li>
            );
          })}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
