import type { CampaignEventType } from '@/models/campaign-event';

type QueuedEvent = { campaignId: string; type: CampaignEventType; variantId?: string; value?: number };

const FLUSH_INTERVAL_MS = 2000;
const MAX_BATCH = 20;
const SESSION_KEY = 'rush.sid';

let queue: QueuedEvent[] = [];
let endpoint = '';
let publicKey = '';
let timer: ReturnType<typeof setTimeout> | null = null;
let enabled = false;

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s${Date.now().toString(36)}0000`;
  }
}

export function initEvents(eventsUrl: string, key: string): void {
  endpoint = eventsUrl;
  publicKey = key;
  enabled = !!eventsUrl && !!key;

  if (!enabled) return;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}

export function flush(): void {
  if (!enabled || !queue.length) return;

  const batch = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);

  const body = JSON.stringify({ key: publicKey, sessionId: sessionId(), events: batch });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    // fall through to fetch
  }

  try {
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {
    // event delivery is best-effort
  }
}

export function track(campaignId: string, type: CampaignEventType, variantId?: string, value?: number): void {
  if (!enabled) return;

  queue.push({ campaignId, type, variantId, value });

  if (queue.length >= MAX_BATCH) {
    flush();
    return;
  }

  if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, FLUSH_INTERVAL_MS);
  }
}
