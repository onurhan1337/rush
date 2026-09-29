import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { kanca } from '@/lib/kanca';
import { getIkas } from '@/helpers/api-helpers';
import { isMassRevocation, refreshIfExpired } from '@/lib/token-health';
import { handleUninstall } from '@/lib/uninstall';
import type { AuthToken } from '@/models/auth-token';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { WebhookEventManager } from '@/models/webhook-event/manager';

// ikas has no app-uninstall webhook, so once a day every stored token is
// refreshed if expired and checked with kanca.checkInstalls (getAuthorizedApp
// null twice). Stores whose refresh token ikas rejects are uninstalled too.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CONCURRENCY = 3;
// Stop starting new checks / uninstalls well before maxDuration.
const CHECK_DEADLINE_MS = 40_000;
const UNINSTALL_DEADLINE_MS = 52_000;

function isAuthorized(request: NextRequest, secret: string): boolean {
  const received = request.headers.get('authorization') ?? '';
  const digest = (value: string) => crypto.createHash('sha256').update(value, 'utf8').digest();
  return crypto.timingSafeEqual(digest(received), digest(`Bearer ${secret}`));
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[rush] token health: CRON_SECRET is not configured');
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 500 });
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const elapsed = () => Date.now() - startedAt;
  const counts = { checked: 0, ok: 0, revoked: 0, unknown: 0, skipped: 0, uninstalled: 0 };

  try {
    // Shuffled so a run cut short by the deadline does not always skip the same stores.
    const queue = shuffle(await AuthTokenManager.listActive());
    const fresh: AuthToken[] = [];
    const refreshRevoked: string[] = [];

    const worker = async () => {
      for (let token = queue.shift(); token; token = queue.shift()) {
        if (elapsed() > CHECK_DEADLINE_MS) {
          counts.skipped++;
          continue;
        }
        let health;
        try {
          health = await refreshIfExpired(token);
        } catch (error) {
          console.error('[rush] token health: refresh failed:', error instanceof Error ? error.message : 'unknown error');
          health = 'unknown' as const;
        }
        if (health === 'ok') fresh.push(token);
        else {
          counts.checked++;
          counts[health]++;
          if (health === 'revoked') refreshRevoked.push(token.authorizedAppId!);
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const byMerchant = new Map(fresh.map((token) => [token.merchantId, token]));
    const { results, massRevocation } = await kanca.checkInstalls(
      fresh.map((token) => ({ merchantId: token.merchantId, client: getIkas(token) })),
      { concurrency: CONCURRENCY, deadlineMs: Math.max(0, CHECK_DEADLINE_MS - elapsed()) },
    );
    const removed: string[] = [];
    for (const result of results) {
      counts.checked++;
      if (result.state === 'installed') counts.ok++;
      else if (result.state === 'unknown') counts.unknown++;
      else {
        counts.revoked++;
        const token = byMerchant.get(result.merchantId);
        if (token?.authorizedAppId) removed.push(token.authorizedAppId);
      }
    }
    if (massRevocation) {
      console.error(`[rush] token health: kanca.checkInstalls refused to record uninstalls (possible ikas auth outage)`);
    }

    const uninstall = async (authorizedAppId: string, reason: 'token-revoked' | 'app-removed') => {
      if (elapsed() > UNINSTALL_DEADLINE_MS) return;
      try {
        if (await handleUninstall(authorizedAppId, { reason })) counts.uninstalled++;
      } catch (error) {
        console.error('[rush] token health: uninstall failed:', error instanceof Error ? error.message : 'unknown error');
      }
    };
    for (const authorizedAppId of removed) await uninstall(authorizedAppId, 'app-removed');
    if (isMassRevocation(refreshRevoked.length, counts.checked)) {
      console.error(`[rush] token health: ${refreshRevoked.length}/${counts.checked} refresh tokens look revoked, refusing to uninstall (possible ikas auth outage)`);
    } else {
      for (const authorizedAppId of refreshRevoked) await uninstall(authorizedAppId, 'token-revoked');
    }

    await WebhookEventManager.prune();

    console.log(
      `[rush] token health: checked=${counts.checked} ok=${counts.ok} revoked=${counts.revoked} unknown=${counts.unknown} skipped=${counts.skipped} uninstalled=${counts.uninstalled} ms=${elapsed()}`,
    );
    return NextResponse.json(counts);
  } catch (error) {
    console.error('[rush] token health failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Token health check failed' }, { status: 500 });
  } finally {
    await kanca.flush();
  }
}
