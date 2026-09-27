import crypto from 'crypto';
import { waitUntil } from '@vercel/functions';
import { WebhookEventManager } from '@/models/webhook-event/manager';
import type { AuthToken } from '@/models/auth-token';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

type IkasClient = ikasAdminGraphQLAPIClient<AuthToken>;

export const WEBHOOK_PATH = '/api/webhooks/ikas';

// Documented scope: must be registered for the app to receive any webhook.
// ikas has no uninstall scope (store/app/* is rejected with INVALID_SCOPE);
// removals are detected by the token-health cron instead.
const REQUIRED_SCOPES = ['store/order/created'];

const MARKER_SCOPE = 'rush/webhook-subscriptions';
const RECHECK_AFTER_MS = 7 * 86400_000;
const RETRY_AFTER_FAILURE_MS = 10 * 60_000;

// Per-instance cache so warm instances skip even the marker lookup.
const nextCheckAt = new Map<string, number>();

export function webhookEndpoint(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}${WEBHOOK_PATH}`;
}

function markerPrefix(authorizedAppId: string): string {
  return `rush:webhooks:${authorizedAppId}:`;
}

function markerId(authorizedAppId: string, endpoint: string): string {
  const version = crypto
    .createHash('sha1')
    .update(`${endpoint}|${REQUIRED_SCOPES.join(',')}`)
    .digest('hex')
    .slice(0, 8);
  return `${markerPrefix(authorizedAppId)}${version}`;
}

function errorCodes(response: { error?: string; errors?: { message: string; extensions?: Record<string, unknown> }[] }): string[] {
  const codes = (response.errors ?? []).map((error) => String(error.extensions?.code ?? error.message));
  if (!codes.length && response.error) codes.push(response.error);
  return codes;
}

async function registeredScopes(ikas: IkasClient, endpoint: string): Promise<Set<string>> {
  try {
    const response = await ikas.queries.listWebhook();
    if (!response.isSuccess || !response.data?.listWebhook) return new Set();
    return new Set(response.data.listWebhook.filter((webhook) => !webhook.deleted && webhook.endpoint === endpoint).map((webhook) => webhook.scope));
  } catch (error) {
    console.error('listWebhook failed, falling back to saveWebhooks upsert:', error);
    return new Set();
  }
}

/**
 * Registers rush's webhook scopes for the store behind `ikas`. Idempotent:
 * scopes already registered to the same endpoint are skipped, and
 * saveWebhooks is an upsert per scope anyway. Resolves true when the
 * required scopes are registered; never throws.
 */
export async function ensureWebhookSubscriptions(ikas: IkasClient, baseUrl: string): Promise<boolean> {
  const endpoint = webhookEndpoint(baseUrl);
  if (!endpoint.startsWith('https://')) {
    console.warn('Skipping ikas webhook subscription, endpoint is not public https:', endpoint);
    return false;
  }

  const registered = await registeredScopes(ikas, endpoint);

  const required = REQUIRED_SCOPES.filter((scope) => !registered.has(scope));
  if (required.length) {
    try {
      const response = await ikas.mutations.saveWebhooks({ input: { endpoint, scopes: required } });
      if (!response.isSuccess) {
        console.error('saveWebhooks failed for', required, errorCodes(response));
        return false;
      }
    } catch (error) {
      console.error('saveWebhooks failed for', required, error);
      return false;
    }
  }

  return true;
}

/**
 * Fire-and-forget wrapper for request handlers. Gated by a per-instance cache
 * and a marker row (WebhookEvent table) so ikas is called at most once per
 * store every RECHECK_AFTER_MS, unless `force` (fresh OAuth install).
 */
export function scheduleWebhookSubscriptions(ikas: IkasClient, authorizedAppId: string, baseUrl: string, options: { force?: boolean } = {}): void {
  const id = markerId(authorizedAppId, webhookEndpoint(baseUrl));
  if (!options.force && (nextCheckAt.get(id) ?? 0) > Date.now()) return;
  nextCheckAt.set(id, Date.now() + RECHECK_AFTER_MS);

  const run = async () => {
    try {
      if (!options.force) {
        const age = await WebhookEventManager.markerAge(id);
        if (age !== undefined && age < RECHECK_AFTER_MS) return;
      }

      const ok = await ensureWebhookSubscriptions(ikas, baseUrl);
      if (ok) {
        await WebhookEventManager.touchMarker(id, MARKER_SCOPE);
      } else {
        nextCheckAt.set(id, Date.now() + RETRY_AFTER_FAILURE_MS);
      }
    } catch (error) {
      nextCheckAt.set(id, Date.now() + RETRY_AFTER_FAILURE_MS);
      console.error('Webhook subscription check failed:', error);
    }
  };

  waitUntil(run());
}

export async function clearWebhookSubscriptionMarkers(authorizedAppId: string): Promise<void> {
  for (const key of nextCheckAt.keys()) {
    if (key.startsWith(markerPrefix(authorizedAppId))) nextCheckAt.delete(key);
  }
  await WebhookEventManager.clearMarkers(markerPrefix(authorizedAppId));
}
