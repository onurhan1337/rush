import type { WidgetConfigPayload } from '@/lib/campaigns/widget-types';

const CACHE_KEY = 'rush.config';
const CACHE_TTL_MS = 60_000;

type CachedConfig = { at: number; payload: WidgetConfigPayload };

function readCache(key: string): WidgetConfigPayload | undefined {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}.${key}`);
    if (!raw) return undefined;
    const cached = JSON.parse(raw) as CachedConfig;
    if (Date.now() - cached.at > CACHE_TTL_MS) return undefined;
    return cached.payload;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, payload: WidgetConfigPayload): void {
  try {
    sessionStorage.setItem(`${CACHE_KEY}.${key}`, JSON.stringify({ at: Date.now(), payload } satisfies CachedConfig));
  } catch {
    // cache is an optimisation only
  }
}

export async function fetchConfig(origin: string, key: string): Promise<WidgetConfigPayload> {
  const cached = readCache(key);
  if (cached) return cached;

  const response = await fetch(`${origin}/api/public/config?key=${encodeURIComponent(key)}`, { credentials: 'omit' });
  if (!response.ok) throw new Error(`config request failed: ${response.status}`);

  const payload = (await response.json()) as WidgetConfigPayload;
  writeCache(key, payload);
  return payload;
}

export function listenForPreviewConfig(onConfig: (payload: WidgetConfigPayload) => void): void {
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.type !== 'rush:preview' || !data.payload) return;
    onConfig(data.payload as WidgetConfigPayload);
  });

  if (window.parent !== window) {
    window.parent.postMessage({ type: 'rush:preview-ready' }, '*');
  }
}
