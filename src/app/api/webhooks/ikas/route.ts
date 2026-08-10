import { NextRequest, NextResponse } from 'next/server';
import { validateIkasWebhookSignature, type IkasWebhook } from '@ikas/admin-api-client';
import { z } from 'zod';
import { config } from '@/globals/config';
import { getIkas } from '@/helpers/api-helpers';
import { deleteIkasCampaigns } from '@/lib/campaigns/ikas-campaign-sync';
import { uninstallScript } from '@/lib/storefront-script';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { CampaignManager } from '@/models/campaign/manager';

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

export async function POST(request: NextRequest) {
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

    if (!UNINSTALL_SCOPES.includes(scope)) return NextResponse.json({ ok: true });

    const authToken = await AuthTokenManager.get(authorizedAppId);
    if (!authToken) return NextResponse.json({ ok: true });

    const ikas = getIkas(authToken);
    const campaigns = await CampaignManager.list(authorizedAppId);

    for (const campaign of campaigns) {
      await deleteIkasCampaigns(ikas, campaign.ikasCampaignIds);
    }

    await uninstallScript(ikas, authorizedAppId);
    await CampaignManager.endAll(authorizedAppId);
    await AuthTokenManager.delete(authorizedAppId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('ikas webhook failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
