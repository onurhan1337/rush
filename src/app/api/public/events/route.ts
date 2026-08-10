import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CAMPAIGN_EVENT_TYPES } from '@/models/campaign-event';
import { CampaignEventManager } from '@/models/campaign-event/manager';
import { CampaignManager } from '@/models/campaign/manager';
import { MerchantSettingsManager } from '@/models/merchant-settings/manager';
import { isValidPublicKeyFormat } from '@/lib/public-key';
import { rateLimit } from '@/lib/rate-limit';

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

const eventsSchema = z.object({
  key: z.string(),
  sessionId: z.string().min(8).max(64),
  events: z
    .array(
      z.object({
        campaignId: z.string().min(1),
        type: z.enum(CAMPAIGN_EVENT_TYPES),
        variantId: z.string().optional(),
      }),
    )
    .min(1)
    .max(20),
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { ...CORS_HEADERS, 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = eventsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ accepted: 0 }, { status: 400, headers: CORS_HEADERS });

    const { key, sessionId, events } = parsed.data;
    if (!isValidPublicKeyFormat(key)) return NextResponse.json({ accepted: 0 }, { status: 400, headers: CORS_HEADERS });

    if (!rateLimit(`${key}:${sessionId}`, 60, 60_000)) {
      return NextResponse.json({ accepted: 0 }, { status: 429, headers: CORS_HEADERS });
    }

    const settings = await MerchantSettingsManager.getByPublicKey(key);
    if (!settings) return NextResponse.json({ accepted: 0 }, { status: 404, headers: CORS_HEADERS });

    const campaigns = await CampaignManager.list(settings.authorizedAppId);
    const ownedIds = new Set(campaigns.map((campaign) => campaign.id));
    const allowed = events.filter((event) => ownedIds.has(event.campaignId));

    const accepted = await CampaignEventManager.record(
      settings.authorizedAppId,
      allowed.map((event) => ({ ...event, sessionId })),
    );

    return NextResponse.json({ accepted }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Public events failed:', error);
    return NextResponse.json({ accepted: 0 }, { status: 500, headers: CORS_HEADERS });
  }
}
