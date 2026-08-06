export type MountTarget =
  | { mode: 'fixed'; side: 'left' | 'right' }
  | { mode: 'selector'; selector: string; position: 'before' | 'after' | 'append' };

export type AppearanceIcon = 'clock' | 'gift' | 'bolt' | 'none';

export type Appearance = {
  mount: MountTarget;
  accentColor: string;
  radius: 0 | 8 | 16;
  icon: AppearanceIcon;
  autoOpen: boolean;
  autoOpenDelaySec: number;
};

export const DEFAULT_APPEARANCE: Appearance = {
  mount: { mode: 'fixed', side: 'left' },
  accentColor: '#0A0A0A',
  radius: 16,
  icon: 'clock',
  autoOpen: false,
  autoOpenDelaySec: 3,
};
