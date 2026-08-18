import crypto from 'crypto';
import { StorefrontJSScriptContentTypeEnum } from '@/lib/ikas-client/generated/graphql';
import { StorefrontScriptManager } from '@/models/storefront-script/manager';
import type { AuthToken } from '@/models/auth-token';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

type IkasClient = ikasAdminGraphQLAPIClient<AuthToken>;

const SCRIPT_NAME = 'Rush';

export type StorefrontInfo = {
  id: string;
  name: string;
  salesChannelId: string;
  currencyCode?: string;
  currencySymbol?: string;
  domain?: string;
};

export type ScriptStatus = {
  storefront: StorefrontInfo;
  installed: boolean;
  upToDate: boolean;
  scriptId?: string;
};

export function scriptVersion(baseUrl: string, publicKey: string): string {
  return crypto.createHash('sha1').update(`${baseUrl}|${publicKey}|2`).digest('hex').slice(0, 8);
}

export function buildScriptContent(publicKey: string, baseUrl: string): string {
  const src = `${baseUrl}/rush.js?v=${scriptVersion(baseUrl, publicKey)}`;
  return `<script src="${src}" data-rush-key="${publicKey}" defer></script>`;
}

export async function listStorefronts(ikas: IkasClient): Promise<StorefrontInfo[]> {
  const response = await ikas.queries.listStorefront();
  if (!response.isSuccess || !response.data?.listStorefront) return [];

  return response.data.listStorefront.map((storefront) => {
    const routing = storefront.routings?.[0];
    return {
      id: storefront.id,
      name: storefront.name,
      salesChannelId: storefront.salesChannelId,
      currencyCode: routing?.currencyCode ?? undefined,
      currencySymbol: routing?.currencySymbol ?? undefined,
      domain: routing?.domain ?? undefined,
    };
  });
}

export async function getScriptStatus(ikas: IkasClient, authorizedAppId: string, publicKey: string, baseUrl: string): Promise<ScriptStatus[]> {
  const [storefronts, records] = await Promise.all([listStorefronts(ikas), StorefrontScriptManager.list(authorizedAppId)]);
  const version = scriptVersion(baseUrl, publicKey);

  return storefronts.map((storefront) => {
    const record = records.find((item) => item.storefrontId === storefront.id && !item.deleted);
    return {
      storefront,
      installed: !!record,
      upToDate: record?.version === version,
      scriptId: record?.scriptId,
    };
  });
}

export async function installScript(ikas: IkasClient, authorizedAppId: string, publicKey: string, baseUrl: string): Promise<ScriptStatus[]> {
  const storefronts = await listStorefronts(ikas);
  const version = scriptVersion(baseUrl, publicKey);
  const scriptContent = buildScriptContent(publicKey, baseUrl);

  for (const storefront of storefronts) {
    const existing = await StorefrontScriptManager.get(authorizedAppId, storefront.id);

    if (existing && !existing.deleted) {
      const response = await ikas.mutations.updateStorefrontJSScript({
        input: { id: existing.scriptId, name: SCRIPT_NAME, scriptContent, isHighPriority: false, contentType: StorefrontJSScriptContentTypeEnum.SCRIPT },
      });
      if (response.isSuccess && response.data?.updateStorefrontJSScript?.id) {
        await StorefrontScriptManager.put({ authorizedAppId, storefrontId: storefront.id, scriptId: existing.scriptId, version });
        continue;
      }
      console.error('updateStorefrontJSScript failed, recreating:', response.errors);
    }

    const response = await ikas.mutations.createStorefrontJSScript({
      input: {
        name: SCRIPT_NAME,
        storefrontId: storefront.id,
        contentType: StorefrontJSScriptContentTypeEnum.SCRIPT,
        isHighPriority: false,
        scriptContent,
      },
    });

    if (response.isSuccess && response.data?.createStorefrontJSScript?.id) {
      await StorefrontScriptManager.put({
        authorizedAppId,
        storefrontId: storefront.id,
        scriptId: response.data.createStorefrontJSScript.id,
        version,
      });
    } else {
      console.error('createStorefrontJSScript failed for storefront', storefront.id, response.errors);
    }
  }

  return getScriptStatus(ikas, authorizedAppId, publicKey, baseUrl);
}

export async function uninstallScript(ikas: IkasClient, authorizedAppId: string): Promise<void> {
  const records = await StorefrontScriptManager.list(authorizedAppId);

  for (const record of records) {
    const neutralized = await ikas.mutations.updateStorefrontJSScript({
      input: { id: record.scriptId, scriptContent: '<!-- Rush removed -->' },
    });
    if (!neutralized.isSuccess) {
      console.error('Failed to neutralize Rush script', record.scriptId, neutralized.errors);
    }

    try {
      await ikas.mutations.deleteStorefrontJSScript();
    } catch (error) {
      console.error('deleteStorefrontJSScript failed (expected, schema takes no arguments):', error);
    }

    await StorefrontScriptManager.markDeleted(authorizedAppId, record.storefrontId);
  }
}
