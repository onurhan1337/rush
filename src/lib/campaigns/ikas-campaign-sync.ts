import { getCampaignType } from './registry';
import type { ResolvedProduct } from './product';
import type { AuthToken } from '@/models/auth-token';
import type { Campaign } from '@/models/campaign';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

type IkasClient = ikasAdminGraphQLAPIClient<AuthToken>;

export type SyncResult = { ok: true; ikasCampaignIds: string[] } | { ok: false; error: string };

// A campaign can map to several ikas discounts (one per product), and the product list can
// change between publishes — recreating from scratch keeps ikas in step with the config
// instead of leaving orphan discounts behind.
export async function upsertIkasCampaign(
  ikas: IkasClient,
  campaign: Campaign,
  products: ResolvedProduct[],
  salesChannelIds: string[],
): Promise<SyncResult> {
  const definition = getCampaignType(campaign.type);
  if (!definition) return { ok: false, error: `Bilinmeyen kampanya tipi: ${campaign.type}` };

  const parsedConfig = definition.configSchema.safeParse(campaign.config);
  if (!parsedConfig.success) {
    return { ok: false, error: parsedConfig.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ') };
  }

  const mapping = definition.toIkasCampaignInput(campaign, parsedConfig.data, { products, salesChannelIds });
  if (!mapping.ok) return mapping;

  await deleteIkasCampaigns(ikas, campaign.ikasCampaignIds);

  const ikasCampaignIds: string[] = [];
  for (const input of mapping.inputs) {
    const response = await ikas.mutations.createCampaign({ input });
    if (!response.isSuccess || !response.data?.createCampaign?.id) {
      await deleteIkasCampaigns(ikas, ikasCampaignIds);
      return { ok: false, error: 'ikas kampanyası oluşturulamadı' };
    }
    ikasCampaignIds.push(response.data.createCampaign.id);
  }

  return { ok: true, ikasCampaignIds };
}

export async function deleteIkasCampaigns(ikas: IkasClient, ikasCampaignIds: string[] | undefined): Promise<void> {
  if (!ikasCampaignIds?.length) return;
  try {
    // codegen renders list-typed variables as `string`; the wire format is a JSON array.
    await ikas.mutations.deleteCampaignList({ idList: ikasCampaignIds as unknown as string });
  } catch (error) {
    console.error('deleteCampaignList failed:', error);
  }
}
