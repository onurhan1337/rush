import { getIkas } from '@/helpers/api-helpers';
import { deleteIkasCampaigns } from '@/lib/campaigns/ikas-campaign-sync';
import { kanca } from '@/lib/kanca';
import { uninstallScript } from '@/lib/storefront-script';
import { clearWebhookSubscriptionMarkers } from '@/lib/webhook-subscriptions';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { CampaignManager } from '@/models/campaign/manager';
import { StorefrontScriptManager } from '@/models/storefront-script/manager';

/**
 * Why rush is uninstalling a store:
 * - 'webhook': ikas sent an uninstall webhook.
 * - 'token-revoked': the daily token health check could not refresh the store's token.
 * - 'app-removed': kanca.checkInstalls found the app removed (Kanca already recorded the uninstall).
 */
export type UninstallReason = 'webhook' | 'token-revoked' | 'app-removed';

/** Runs one uninstall step; a failure (e.g. token already revoked) must not stop the rest. */
async function bestEffort(step: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error(`Uninstall step "${step}" failed:`, error);
  }
}

/**
 * Cleans up everything rush holds for a store that removed the app. ikas calls
 * are best effort (the token is usually revoked by now); the database steps
 * throw so callers can retry. Resolves false when there was no active token.
 */
export async function handleUninstall(authorizedAppId: string, options: { reason: UninstallReason }): Promise<boolean> {
  const authToken = await AuthTokenManager.get(authorizedAppId);
  if (!authToken || authToken.deleted) return false;

  const ikas = getIkas(authToken);
  const campaigns = await CampaignManager.list(authorizedAppId);

  for (const campaign of campaigns) {
    await bestEffort('deleteIkasCampaigns', () => deleteIkasCampaigns(ikas, campaign.ikasCampaignIds));
  }

  // ikas removes the app's storefront scripts itself when the app is removed
  // (observed: storefront_sf_script_not_found), so after a token check the
  // calls would only record false Admin API failures. Campaigns are not removed
  // by ikas, so they are always deleted above.
  if (options.reason === 'webhook') {
    await bestEffort('uninstallScript', () => uninstallScript(ikas, authorizedAppId));
  }
  await bestEffort('markScriptsDeleted', async () => {
    for (const record of await StorefrontScriptManager.list(authorizedAppId)) {
      await StorefrontScriptManager.markDeleted(authorizedAppId, record.storefrontId);
    }
  });
  await CampaignManager.endAll(authorizedAppId);
  await AuthTokenManager.delete(authorizedAppId);
  await bestEffort('clearWebhookSubscriptionMarkers', () => clearWebhookSubscriptionMarkers(authorizedAppId));

  if (options.reason !== 'app-removed') {
    kanca.track('uninstall', { merchantId: authToken.merchantId, attrs: { source: options.reason } });
  }

  return true;
}
