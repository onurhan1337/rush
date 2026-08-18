'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n';
import type { EntityRef } from '@/lib/campaigns/rules/types';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;
const MAX_SELECTED = 50;

type Props = {
  value: EntityRef[];
  onChange: (next: EntityRef[]) => void;
  onSearch: (query: string) => Promise<EntityRef[]>;
  placeholder: string;
  requireSlug?: boolean;
};

export function EntityPicker({ value, onChange, onSearch, placeholder, requireSlug }: Props) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EntityRef[]>([]);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      requestRef.current += 1;
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      const requestId = ++requestRef.current;
      setLoading(true);

      try {
        const found = await onSearch(trimmed);
        if (requestRef.current === requestId) setResults(found);
      } catch {
        if (requestRef.current === requestId) setResults([]);
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(
    () => () => {
      requestRef.current += 1;
    },
    [],
  );

  const add = useCallback(
    (entity: EntityRef) => {
      setQuery('');
      setResults([]);
      if (value.length >= MAX_SELECTED || value.some((item) => item.id === entity.id)) return;
      onChange([...value, entity]);
    },
    [onChange, value],
  );

  const remove = useCallback((id: string) => onChange(value.filter((item) => item.id !== id)), [onChange, value]);

  const searched = query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder={placeholder} value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      {loading ? <Skeleton className="h-10 w-full" /> : null}

      {!loading && searched && results.length ? (
        <ul className="divide-y rounded-md border">
          {results.map((entity) => {
            const added = value.some((item) => item.id === entity.id);
            return (
              <li key={entity.id}>
                <button
                  type="button"
                  onClick={() => add(entity)}
                  disabled={added}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent disabled:opacity-50"
                >
                  <span className="truncate">{entity.name}</span>
                  {added ? <Check className="size-3.5 shrink-0" /> : <Plus className="size-3.5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && searched && !results.length ? (
        <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">{t('rules.noResults')}</p>
      ) : null}

      {value.length ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((entity) => {
            const missingSlug = !!requireSlug && !entity.slug;
            return (
              <li
                key={entity.id}
                className="flex max-w-full items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-xs"
                title={missingSlug ? t('rules.missingSlug') : entity.slug}
              >
                {missingSlug ? <AlertTriangle className="size-3 shrink-0 text-amber-600" /> : null}
                <span className="truncate">{entity.name || entity.id}</span>
                <button
                  type="button"
                  onClick={() => remove(entity.id)}
                  aria-label={t('rules.removeEntity')}
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {requireSlug && value.some((entity) => !entity.slug) ? (
        <p className="text-xs text-amber-600">{t('rules.missingSlug')}</p>
      ) : null}
    </div>
  );
}
