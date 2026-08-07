'use client';

import { Input } from '@/components/ui/input';
import { parseHex } from '@/lib/color';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function normalize(raw: string): string {
  const trimmed = raw.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return withHash.slice(0, 7).toUpperCase();
}

export function ColorField({ value, onChange }: Props) {
  const valid = !!parseHex(value);

  return (
    <div className="flex items-center gap-2">
      <label
        className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-sm"
        style={{ backgroundColor: valid ? value : '#FFFFFF' }}
      >
        <input
          type="color"
          value={valid ? value : '#000000'}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        value={value}
        onChange={(event) => onChange(normalize(event.target.value))}
        spellCheck={false}
        className="min-w-0 flex-1 font-mono text-xs uppercase"
      />
    </div>
  );
}
