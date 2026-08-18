import type { WidgetConfigPayload } from '@/lib/campaigns/widget-types';

const CACHE_KEY = 'rush.config';
const BUCKET_MS = 30_000;

type CachedConfig = { bucket: number; payload: WidgetConfigPayload };

function currentBucket(): number {
  return Math.floor(Date.now() / BUCKET_MS);
}

function readCache(key: string, bucket: number): WidgetConfigPayload | undefined {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}.${key}`);
    if (!raw) return undefined;
    const cached = JSON.parse(raw) as CachedConfig;
    return cached.bucket === bucket ? cached.payload : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, bucket: number, payload: WidgetConfigPayload): void {
  try {
    sessionStorage.setItem(`${CACHE_KEY}.${key}`, JSON.stringify({ bucket, payload } satisfies CachedConfig));
  } catch {
    return;
  }
}

export async function fetchConfig(origin: string, key: string): Promise<WidgetConfigPayload> {
  const bucket = currentBucket();
  const cached = readCache(key, bucket);
  if (cached) return cached;

  const url = `${origin}/api/public/config?key=${encodeURIComponent(key)}&t=${bucket}`;
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) throw new Error(`config request failed: ${response.status}`);

  const payload = (await response.json()) as WidgetConfigPayload;
  writeCache(key, bucket, payload);
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
