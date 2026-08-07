import type { ZodType, ZodTypeDef } from 'zod';
import type { Campaign } from '@/models/campaign';
import type { ResolvedProduct } from './product';
import type { RuleKind } from './rules/types';
import type { WidgetCampaign } from './widget-types';
import type { IkasCampaignMapping, MappingContext } from './types/offer-product/ikas-campaign';

export type { IkasCampaignMapping, MappingContext };

export interface CampaignTypeDefinition<TConfig = unknown> {
  key: string;
  label: string;
  description: string;
  configSchema: ZodType<TConfig, ZodTypeDef, any>;
  defaultConfig: TConfig;
  supportedRules: RuleKind[];
  toIkasCampaignInput(campaign: Campaign, config: TConfig, context: MappingContext): IkasCampaignMapping;
  toWidgetPayload(campaign: Campaign, config: TConfig, products: ResolvedProduct[]): WidgetCampaign | null;
}

export type AnyCampaignTypeDefinition = CampaignTypeDefinition<any>;
