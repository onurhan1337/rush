'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Option<T> = {
  value: T;
  label: ReactNode;
  title?: string;
};

type Props<T extends string | number> = {
  value: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
  className?: string;
};

export function Segmented<T extends string | number>({ value, options, onChange, className }: Props<T>) {
  return (
    <div className={cn('inline-flex w-fit rounded-md border p-0.5', className)}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          title={option.title}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex h-7 min-w-9 items-center justify-center rounded-[5px] px-2.5 text-xs transition-colors',
            value === option.value ? 'bg-foreground font-medium text-background' : 'text-muted-foreground hover:bg-accent',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
