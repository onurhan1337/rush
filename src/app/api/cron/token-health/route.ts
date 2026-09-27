import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { kanca } from '@/lib/kanca';
import { checkTokenHealth, isMassRevocation } from '@/lib/token-health';
import { handleUninstall } from '@/lib/uninstall';
import { AuthTokenManager } from '@/models/auth-token/manager';

// ikas has no app-uninstall webhook, so once a day every stored token is
// probed; stores whose token ikas rejects are treated as uninstalled.

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
    const revokedAppIds: string[] = [];

    const worker = async () => {
      for (let token = queue.shift(); token; token = queue.shift()) {
        if (elapsed() > CHECK_DEADLINE_MS) {
          counts.skipped++;
          continue;
        }
        let health;
        try {
          health = await checkTokenHealth(token);
        } catch (error) {
          console.error('[rush] token health: check failed:', error instanceof Error ? error.message : 'unknown error');
          health = 'unknown' as const;
        }
        counts.checked++;
        counts[health]++;
        if (health === 'revoked') revokedAppIds.push(token.authorizedAppId!);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    if (isMassRevocation(counts.revoked, counts.checked)) {
      console.error(`[rush] token health: ${counts.revoked}/${counts.checked} tokens look revoked, refusing to uninstall (possible ikas auth outage)`);
    } else {
      for (const authorizedAppId of revokedAppIds) {
        if (elapsed() > UNINSTALL_DEADLINE_MS) break;
        try {
          if (await handleUninstall(authorizedAppId, { reason: 'token-revoked' })) counts.uninstalled++;
        } catch (error) {
          console.error('[rush] token health: uninstall failed:', error instanceof Error ? error.message : 'unknown error');
        }
      }
    }

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
