import { getCampaignType } from './registry';
import type { ResolvedProduct } from './product';
import type { AuthToken } from '@/models/auth-token';
import type { Campaign } from '@/models/campaign';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

type IkasClient = ikasAdminGraphQLAPIClient<AuthToken>;

export type SyncResult = { ok: true; ikasCampaignId: string } | { ok: false; error: string };

export async function upsertIkasCampaign(
  ikas: IkasClient,
  campaign: Campaign,
  product: ResolvedProduct,
  salesChannelIds: string[],
): Promise<SyncResult> {
  const definition = getCampaignType(campaign.type);
  if (!definition) return { ok: false, error: `Bilinmeyen kampanya tipi: ${campaign.type}` };

  const parsedConfig = definition.configSchema.safeParse(campaign.config);
  if (!parsedConfig.success) {
    return { ok: false, error: parsedConfig.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ') };
  }

  const mapping = definition.toIkasCampaignInput(campaign, parsedConfig.data, { product, salesChannelIds });
  if (!mapping.ok) return mapping;

  if (campaign.ikasCampaignId) {
    const response = await ikas.mutations.updateCampaign({ input: { ...mapping.input, id: campaign.ikasCampaignId } });
    if (response.isSuccess && response.data?.updateCampaign?.id) {
      return { ok: true, ikasCampaignId: response.data.updateCampaign.id };
    }
    console.error('updateCampaign failed, falling back to create:', response.errors);
  }

  const response = await ikas.mutations.createCampaign({ input: mapping.input });
  if (response.isSuccess && response.data?.createCampaign?.id) {
    return { ok: true, ikasCampaignId: response.data.createCampaign.id };
  }

  return { ok: false, error: 'ikas kampanyası oluşturulamadı' };
}

export async function deleteIkasCampaign(ikas: IkasClient, ikasCampaignId: string | undefined): Promise<void> {
  if (!ikasCampaignId) return;
  try {
    // codegen renders list-typed variables as `string`; the wire format is a JSON array.
    await ikas.mutations.deleteCampaignList({ idList: [ikasCampaignId] as unknown as string });
  } catch (error) {
    console.error('deleteCampaignList failed:', error);
  }
}
