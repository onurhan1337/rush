import { NextRequest, NextResponse } from 'next/server';
import { validateIkasWebhookSignature, type IkasWebhook } from '@ikas/admin-api-client';
import { z } from 'zod';
import { config } from '@/globals/config';
import { WebhookEventManager } from '@/models/webhook-event/manager';
import { kanca } from '@/lib/kanca';

const webhookSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  scope: z.string().min(1),
  merchantId: z.string().min(1),
  authorizedAppId: z.string().min(1),
  data: z.string(),
  signature: z.string().min(1),
});

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

    const firstDelivery = await WebhookEventManager.markProcessed(webhook.id, webhook.scope);
    if (!firstDelivery) return NextResponse.json({ ok: true, duplicate: true });
    deliveryId = webhook.id;

    // ikas has no uninstall webhook; removals are handled by the token-health cron.
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('ikas webhook failed:', error);
    // Let ikas' retry reprocess the delivery instead of being dropped as a duplicate.
    if (deliveryId) await WebhookEventManager.unmark(deliveryId).catch(() => undefined);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
});
