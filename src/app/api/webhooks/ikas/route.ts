import { NextRequest, NextResponse } from 'next/server';
import { validateIkasWebhookSignature, type IkasWebhook } from '@ikas/admin-api-client';
import { z } from 'zod';
import { config } from '@/globals/config';
import { getIkas } from '@/helpers/api-helpers';
import { deleteIkasCampaigns } from '@/lib/campaigns/ikas-campaign-sync';
import { uninstallScript } from '@/lib/storefront-script';
import { clearWebhookSubscriptionMarkers } from '@/lib/webhook-subscriptions';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { CampaignManager } from '@/models/campaign/manager';
import { StorefrontScriptManager } from '@/models/storefront-script/manager';
import { WebhookEventManager } from '@/models/webhook-event/manager';
import { kanca } from '@/lib/kanca';

const UNINSTALL_SCOPES = ['store/app/deleted', 'store/app/uninstalled', 'store/authorizedApp/deleted'];

const webhookSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  scope: z.string().min(1),
  merchantId: z.string().min(1),
  authorizedAppId: z.string().min(1),
  data: z.string(),
  signature: z.string().min(1),
});

/** Runs one uninstall step; a failure (e.g. token already revoked) must not stop the rest. */
async function bestEffort(step: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error(`Uninstall step "${step}" failed:`, error);
  }
}

export const POST = kanca.webhook(async (request: NextRequest) => {
  let deliveryId: string | undefined;
  try {
    if (!config.oauth.clientSecret) {
      console.error('ikas webhook verification is not configured');
      return NextResponse.json({ error: 'Webhook verification unavailable' }, { status: 500 });
    }

    const parsed = webhookSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });

    const webhook = parsed.data as IkasWebhook;
    if (!validateIkasWebhookSignature(webhook, config.oauth.clientSecret)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { scope, authorizedAppId } = webhook;

    const firstDelivery = await WebhookEventManager.markProcessed(webhook.id, scope);
    if (!firstDelivery) return NextResponse.json({ ok: true, duplicate: true });
    deliveryId = webhook.id;

    // Everything else (e.g. store/order/created) is acknowledged immediately.
    if (!UNINSTALL_SCOPES.includes(scope)) return NextResponse.json({ ok: true });

    const authToken = await AuthTokenManager.get(authorizedAppId);
    if (!authToken || authToken.deleted) return NextResponse.json({ ok: true });

    // The token may already be revoked by ikas at this point, so every ikas call is best effort.
    const ikas = getIkas(authToken);
    const campaigns = await CampaignManager.list(authorizedAppId);

    for (const campaign of campaigns) {
      await bestEffort('deleteIkasCampaigns', () => deleteIkasCampaigns(ikas, campaign.ikasCampaignIds));
    }

    await bestEffort('uninstallScript', () => uninstallScript(ikas, authorizedAppId));
    await bestEffort('markScriptsDeleted', async () => {
      for (const record of await StorefrontScriptManager.list(authorizedAppId)) {
        await StorefrontScriptManager.markDeleted(authorizedAppId, record.storefrontId);
      }
    });
    await CampaignManager.endAll(authorizedAppId);
    await AuthTokenManager.delete(authorizedAppId);
    await bestEffort('clearWebhookSubscriptionMarkers', () => clearWebhookSubscriptionMarkers(authorizedAppId));
    await WebhookEventManager.prune();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('ikas webhook failed:', error);
    // Let ikas' retry reprocess the delivery instead of being dropped as a duplicate.
    if (deliveryId) await WebhookEventManager.unmark(deliveryId).catch(() => undefined);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
});
