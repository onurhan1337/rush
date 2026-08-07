import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { deleteIkasCampaigns } from '@/lib/campaigns/ikas-campaign-sync';
import { uninstallScript } from '@/lib/storefront-script';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { CampaignManager } from '@/models/campaign/manager';

const UNINSTALL_SCOPES = ['store/app/uninstalled', 'store/authorizedApp/deleted'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const scope: string | undefined = body?.scope ?? request.headers.get('x-ikas-scope') ?? undefined;
    const authorizedAppId: string | undefined = body?.authorizedAppId ?? body?.data?.authorizedAppId;

    if (!authorizedAppId) return NextResponse.json({ ok: true });
    if (scope && !UNINSTALL_SCOPES.includes(scope)) return NextResponse.json({ ok: true });

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
    return NextResponse.json({ ok: true });
  }
}
