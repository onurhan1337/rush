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
 * - 'webhook': ikas sent an uninstall webhook (Kanca's webhook wrapper already records the uninstall).
 * - 'token-revoked': the daily token health check found the store's token revoked.
 */
export type UninstallReason = 'webhook' | 'token-revoked';

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

  await bestEffort('uninstallScript', () => uninstallScript(ikas, authorizedAppId));
  await bestEffort('markScriptsDeleted', async () => {
    for (const record of await StorefrontScriptManager.list(authorizedAppId)) {
      await StorefrontScriptManager.markDeleted(authorizedAppId, record.storefrontId);
    }
  });
  await CampaignManager.endAll(authorizedAppId);
  await AuthTokenManager.delete(authorizedAppId);
  await bestEffort('clearWebhookSubscriptionMarkers', () => clearWebhookSubscriptionMarkers(authorizedAppId));

  // The webhook path is already recorded by kanca.webhook() for uninstall scopes.
  if (options.reason !== 'webhook') {
    kanca.track('uninstall', { merchantId: authToken.merchantId, attrs: { source: 'token-check' } });
  }

  return true;
}
