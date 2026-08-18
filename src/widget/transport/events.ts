import type { CampaignEventType } from '@/models/campaign-event';

type QueuedEvent = { campaignId: string; type: CampaignEventType; variantId?: string; value?: number };

const FLUSH_INTERVAL_MS = 2000;
const MAX_BATCH = 20;
const SESSION_KEY = 'rush.sid';
const CONTENT_TYPE = 'text/plain;charset=UTF-8';

let queue: QueuedEvent[] = [];
let endpoint = '';
let publicKey = '';
let timer: ReturnType<typeof setTimeout> | null = null;
let enabled = false;
let listening = false;

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

  if (!enabled || listening) return;
  listening = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}

function deliver(body: string): boolean {
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: CONTENT_TYPE }))) return true;
  } catch {
  }

  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': CONTENT_TYPE },
      body,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function flush(): void {
  if (!enabled || !queue.length) return;

  const batch = queue.slice(0, MAX_BATCH);
  const pending = queue.slice(MAX_BATCH);
  queue = pending;

  const body = JSON.stringify({ key: publicKey, sessionId: sessionId(), events: batch });
  if (!deliver(body)) queue = batch.concat(pending);
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
