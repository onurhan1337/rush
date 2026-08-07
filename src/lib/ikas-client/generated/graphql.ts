import { BaseGraphQLAPIClient, BaseGraphQLAPIClientOptions, APIResult } from '@ikas/admin-api-client';

export enum CampaignApplicablePriceEnum {
  DISCOUNT_PRICE = "DISCOUNT_PRICE",
  SELL_PRICE = "SELL_PRICE"
}

export enum CampaignCreatedForEnum {
  ABANDONED_CHECKOUT = "ABANDONED_CHECKOUT",
  CART = "CART",
  CUSTOMER_REVIEW = "CUSTOMER_REVIEW",
  LOYALTY_SPEND = "LOYALTY_SPEND",
  MARKETING_CAMPAIGN = "MARKETING_CAMPAIGN"
}

export enum CampaignFilterTypeEnum {
  CATEGORY = "CATEGORY",
  DYNAMIC_CATEGORY = "DYNAMIC_CATEGORY",
  PRODUCT = "PRODUCT",
  PRODUCT_AND_VARIANT = "PRODUCT_AND_VARIANT",
  PRODUCT_BRAND = "PRODUCT_BRAND",
  PRODUCT_TAG = "PRODUCT_TAG",
  VARIANT = "VARIANT"
}

export enum CampaignGetYDiscountTypeEnum {
  AMOUNT = "AMOUNT",
  FIXED_PRODUCT_PRICE = "FIXED_PRODUCT_PRICE",
  RATIO = "RATIO"
}

export enum CampaignPeriodLimitScopeEnum {
  CALENDAR_MONTH = "CALENDAR_MONTH",
  CALENDAR_WEEK = "CALENDAR_WEEK",
  ROLLING_DAYS = "ROLLING_DAYS"
}

export enum CampaignTypeEnum {
  BUY_X_THEN_GET_Y = "BUY_X_THEN_GET_Y",
  FIXED_AMOUNT = "FIXED_AMOUNT",
  FREE_SHIPPING = "FREE_SHIPPING",
  RATIO = "RATIO"
}

export enum StorefrontJSScriptContentTypeEnum {
  FILE = "FILE",
  SCRIPT = "SCRIPT"
}

export type BuyXInput = {
  amount: number;
  applyByQuantity: boolean;
  filter: CampaignFilterInput;
  maxAmount?: number;
}

export type BuyXThenGetYInput = {
  buyX: BuyXInput;
  getY: GetYInput;
  maxUsagePerOrder?: number;
}

export type CampaignDateRangeFieldInput = {
  end?: number;
  start?: number;
}

export type CampaignFilterInput = {
  idList: Array<string>;
  type: CampaignFilterTypeEnum;
}

export type CampaignMinMaxRangeFieldInput = {
  max?: number;
  min?: number;
}

export type CampaignPeriodUsageLimitInput = {
  maxUsage: number;
  rollingDays?: number;
  scope: CampaignPeriodLimitScopeEnum;
}

export type CampaignTranslationInput = {
  locale: string;
  title?: string;
}

export type CreateCampaignInput = {
  applicableCustomerGroupIds?: Array<string>;
  applicableCustomerIds?: Array<string>;
  applicableCustomerSegmentIds?: Array<string>;
  applicablePrice: CampaignApplicablePriceEnum;
  applyCampaignToProductPrice?: boolean;
  buyXThenGetY?: BuyXThenGetYInput;
  canCombineWithOtherCampaigns: boolean;
  couponPrefix?: string;
  couponValidityPeriod?: number;
  createdFor?: CampaignCreatedForEnum;
  currencyCodes?: Array<string>;
  dateRange?: CampaignDateRangeFieldInput;
  fixedDiscount?: FixedDiscountInput;
  hasCoupon: boolean;
  includeDiscountedProducts?: boolean;
  isFreeShipping?: boolean;
  onlyUseCustomer?: boolean;
  periodUsageLimits?: Array<CampaignPeriodUsageLimitInput>;
  salesChannelIds?: Array<string>;
  tieredDiscount?: TieredDiscountInput;
  title: string;
  translations?: Array<CampaignTranslationInput>;
  type: CampaignTypeEnum;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
}

export type CreateStorefrontJSScriptInput = {
  contentType: StorefrontJSScriptContentTypeEnum;
  fileName?: string;
  isHighPriority?: boolean;
  name: string;
  scriptContent: string;
  storefrontId: string;
}

export type FixedDiscountInput = {
  amount?: number;
  filters?: Array<CampaignFilterInput>;
  isApplyByCartAmount?: boolean;
  lineItemQuantityRange?: CampaignMinMaxRangeFieldInput;
  priceRange?: CampaignMinMaxRangeFieldInput;
  shouldMatchAllConditions?: boolean;
}

export type GetYInput = {
  amount: number;
  automaticallyAddItemToCart?: boolean;
  discountRatio: number;
  discountType?: CampaignGetYDiscountTypeEnum;
  filter: CampaignFilterInput;
}

export type PaginationInput = {
  limit?: number;
  page?: number;
}

export type StringFilterInput = {
  eq?: string;
  in?: Array<string>;
  ne?: string;
  nin?: Array<string>;
}

export type TieredDiscountInput = {
  filters?: Array<CampaignFilterInput>;
  isApplyByCartAmount?: boolean;
  rules: Array<TieredDiscountRuleInput>;
  shouldMatchAllConditions?: boolean;
}

export type TieredDiscountRuleInput = {
  amount: number;
  lineItemQuantityRange?: CampaignMinMaxRangeFieldInput;
  priceRange?: CampaignMinMaxRangeFieldInput;
}

export type UpdateCampaignFilterInput = {
  idList: Array<string>;
  type?: CampaignFilterTypeEnum;
}

export type UpdateCampaignInput = {
  applicableCustomerGroupIds?: Array<string>;
  applicableCustomerIds?: Array<string>;
  applicableCustomerSegmentIds?: Array<string>;
  applicablePrice: CampaignApplicablePriceEnum;
  applyCampaignToProductPrice?: boolean;
  buyXThenGetY?: BuyXThenGetYInput;
  canCombineWithOtherCampaigns: boolean;
  couponPrefix?: string;
  couponValidityPeriod?: number;
  createdFor?: CampaignCreatedForEnum;
  currencyCodes?: Array<string>;
  dateRange?: CampaignDateRangeFieldInput;
  fixedDiscount?: UpdateFixedDiscountInput;
  hasCoupon?: boolean;
  id: string;
  includeDiscountedProducts?: boolean;
  isFreeShipping?: boolean;
  onlyUseCustomer?: boolean;
  periodUsageLimits?: Array<CampaignPeriodUsageLimitInput>;
  salesChannelIds?: Array<string>;
  tieredDiscount?: UpdateTieredDiscountInput;
  title?: string;
  translations?: Array<UpdateCampaignTranslationInput>;
  type?: CampaignTypeEnum;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
}

export type UpdateCampaignTranslationInput = {
  locale?: string;
  title?: string;
}

export type UpdateFixedDiscountInput = {
  amount?: number;
  filters?: Array<UpdateCampaignFilterInput>;
  isApplyByCartAmount?: boolean;
  lineItemQuantityRange?: CampaignMinMaxRangeFieldInput;
  priceRange?: CampaignMinMaxRangeFieldInput;
  shouldMatchAllConditions?: boolean;
}

export type UpdateStorefrontJSScriptInput = {
  contentType?: StorefrontJSScriptContentTypeEnum;
  fileName?: string;
  id: string;
  isHighPriority?: boolean;
  name?: string;
  scriptContent?: string;
  storefrontId?: string;
}

export type UpdateTieredDiscountInput = {
  filters?: Array<UpdateCampaignFilterInput>;
  isApplyByCartAmount?: boolean;
  rules?: Array<UpdateTieredDiscountRuleInput>;
  shouldMatchAllConditions?: boolean;
}

export type UpdateTieredDiscountRuleInput = {
  amount?: number;
  lineItemQuantityRange?: CampaignMinMaxRangeFieldInput;
  priceRange?: CampaignMinMaxRangeFieldInput;
}

export type WebhookInput = {
  endpoint: string;
  salesChannelIds?: Array<string>;
  scopes: Array<string>;
}

export type GetMerchantQueryVariables = {}

export type GetMerchantQueryData = {
  id: string;
  email: string;
  storeName?: string;
}

export interface GetMerchantQuery {
  getMerchant: GetMerchantQueryData;
}

export type GetAuthorizedAppQueryVariables = {}

export type GetAuthorizedAppQueryData = {
  id: string;
  salesChannelId?: string;
}

export interface GetAuthorizedAppQuery {
  getAuthorizedApp: GetAuthorizedAppQueryData;
}

export type ListStorefrontQueryVariables = {}

export type ListStorefrontQueryData = Array<{
  id: string;
  name: string;
  salesChannelId: string;
  routings: Array<{
  id: string;
  domain?: string;
  path?: string;
  locale: string;
  currencyCode?: string;
  currencySymbol?: string;
  countryCodes?: Array<string>;
}>;
}>

export interface ListStorefrontQuery {
  listStorefront: ListStorefrontQueryData;
}

export type SearchProductQueryVariables = {
  search?: string;
  pagination?: PaginationInput;
}

export type SearchProductQueryData = {
  count: number;
  hasNext: boolean;
  limit: number;
  page: number;
  data: Array<{
  id: string;
  name: string;
  productOptionSetId?: string;
  totalStock?: number;
  metaData?: {
  id: string;
  slug: string;
};
  variants: Array<{
  id: string;
  isActive: boolean;
  sku?: string;
  sellIfOutOfStock?: boolean;
  images?: Array<{
  imageId?: string;
  fileName?: string;
  isMain: boolean;
  order: number;
  isVideo?: boolean;
}>;
  prices: Array<{
  sellPrice: number;
  discountPrice?: number;
  currencyCode?: string;
  currencySymbol?: string;
  priceListId?: string;
}>;
  variantValues?: Array<{
  variantTypeId: string;
  variantTypeName: string;
  variantValueId: string;
  variantValueName: string;
}>;
  stocks?: Array<{
  stockCount: number;
  stockLocationId: string;
}>;
}>;
}>;
}

export interface SearchProductQuery {
  listProduct: SearchProductQueryData;
}

export type GetProductByIdQueryVariables = {
  id?: StringFilterInput;
}

export type GetProductByIdQueryData = {
  data: Array<{
  id: string;
  name: string;
  productOptionSetId?: string;
  totalStock?: number;
  metaData?: {
  id: string;
  slug: string;
};
  variants: Array<{
  id: string;
  isActive: boolean;
  sku?: string;
  sellIfOutOfStock?: boolean;
  images?: Array<{
  imageId?: string;
  fileName?: string;
  isMain: boolean;
  order: number;
  isVideo?: boolean;
}>;
  prices: Array<{
  sellPrice: number;
  discountPrice?: number;
  currencyCode?: string;
  currencySymbol?: string;
  priceListId?: string;
}>;
  variantValues?: Array<{
  variantTypeId: string;
  variantTypeName: string;
  variantValueId: string;
  variantValueName: string;
}>;
  stocks?: Array<{
  stockCount: number;
  stockLocationId: string;
}>;
}>;
}>;
}

export interface GetProductByIdQuery {
  listProduct: GetProductByIdQueryData;
}

export type CreateStorefrontJSScriptMutationVariables = {
  input: CreateStorefrontJSScriptInput;
}

export type CreateStorefrontJSScriptMutationData = {
  id: string;
  name: string;
  storefrontId: string;
  isHighPriority?: boolean;
  contentType?: StorefrontJSScriptContentTypeEnum;
  scriptContent: string;
}

export interface CreateStorefrontJSScriptMutation {
  createStorefrontJSScript: CreateStorefrontJSScriptMutationData;
}

export type UpdateStorefrontJSScriptMutationVariables = {
  input: UpdateStorefrontJSScriptInput;
}

export type UpdateStorefrontJSScriptMutationData = {
  id: string;
  name: string;
  storefrontId: string;
  isHighPriority?: boolean;
  contentType?: StorefrontJSScriptContentTypeEnum;
  scriptContent: string;
}

export interface UpdateStorefrontJSScriptMutation {
  updateStorefrontJSScript: UpdateStorefrontJSScriptMutationData;
}

export type DeleteStorefrontJSScriptMutationVariables = {}

export type DeleteStorefrontJSScriptMutationData = boolean

export interface DeleteStorefrontJSScriptMutation {
  deleteStorefrontJSScript: DeleteStorefrontJSScriptMutationData;
}

export type CreateCampaignMutationVariables = {
  input: CreateCampaignInput;
}

export type CreateCampaignMutationData = {
  id: string;
  title: string;
  type: CampaignTypeEnum;
}

export interface CreateCampaignMutation {
  createCampaign: CreateCampaignMutationData;
}

export type UpdateCampaignMutationVariables = {
  input: UpdateCampaignInput;
}

export type UpdateCampaignMutationData = {
  id: string;
  title: string;
  type: CampaignTypeEnum;
}

export interface UpdateCampaignMutation {
  updateCampaign: UpdateCampaignMutationData;
}

export type DeleteCampaignListMutationVariables = {
  idList: string;
}

export type DeleteCampaignListMutationData = boolean

export interface DeleteCampaignListMutation {
  deleteCampaignList: DeleteCampaignListMutationData;
}

export type SaveWebhooksMutationVariables = {
  input: WebhookInput;
}

export type SaveWebhooksMutationData = Array<{
  id: string;
  scope: string;
  endpoint: string;
}>

export interface SaveWebhooksMutation {
  saveWebhooks: SaveWebhooksMutationData;
}

export type DeleteWebhookMutationVariables = {
  scopes: string;
}

export type DeleteWebhookMutationData = boolean

export interface DeleteWebhookMutation {
  deleteWebhook: DeleteWebhookMutationData;
}

export class GeneratedQueries {
  client: BaseGraphQLAPIClient<any>;

  constructor(client: BaseGraphQLAPIClient<any>) {
    this.client = client;
  }

  async getMerchant(): Promise<APIResult<Partial<GetMerchantQuery>>> {
    const query = `
  query getMerchant {
    getMerchant {
      id
      email
      storeName
    }
  }
`;
    return this.client.query<Partial<GetMerchantQuery>>({ query });
  }

  async getAuthorizedApp(): Promise<APIResult<Partial<GetAuthorizedAppQuery>>> {
    const query = `
  query getAuthorizedApp {
    getAuthorizedApp {
      id
      salesChannelId
    }
  }
`;
    return this.client.query<Partial<GetAuthorizedAppQuery>>({ query });
  }

  async listStorefront(): Promise<APIResult<Partial<ListStorefrontQuery>>> {
    const query = `
  query listStorefront {
    listStorefront {
      id
      name
      salesChannelId
      routings {
        id
        domain
        path
        locale
        currencyCode
        currencySymbol
        countryCodes
      }
    }
  }
`;
    return this.client.query<Partial<ListStorefrontQuery>>({ query });
  }

  async searchProduct(variables: SearchProductQueryVariables): Promise<APIResult<Partial<SearchProductQuery>>> {
    const query = `
  query searchProduct($search: String, $pagination: PaginationInput) {
    listProduct(search: $search, pagination: $pagination) {
      count
      hasNext
      limit
      page
      data {
        id
        name
        productOptionSetId
        totalStock
        metaData {
          id
          slug
        }
        variants {
          id
          isActive
          sku
          sellIfOutOfStock
          images {
            imageId
            fileName
            isMain
            order
            isVideo
          }
          prices {
            sellPrice
            discountPrice
            currencyCode
            currencySymbol
            priceListId
          }
          variantValues {
            variantTypeId
            variantTypeName
            variantValueId
            variantValueName
          }
          stocks {
            stockCount
            stockLocationId
          }
        }
      }
    }
  }
`;
    return this.client.query<Partial<SearchProductQuery>>({ query, variables });
  }

  async getProductById(variables: GetProductByIdQueryVariables): Promise<APIResult<Partial<GetProductByIdQuery>>> {
    const query = `
  query getProductById($id: StringFilterInput) {
    listProduct(id: $id) {
      data {
        id
        name
        productOptionSetId
        totalStock
        metaData {
          id
          slug
        }
        variants {
          id
          isActive
          sku
          sellIfOutOfStock
          images {
            imageId
            fileName
            isMain
            order
            isVideo
          }
          prices {
            sellPrice
            discountPrice
            currencyCode
            currencySymbol
            priceListId
          }
          variantValues {
            variantTypeId
            variantTypeName
            variantValueId
            variantValueName
          }
          stocks {
            stockCount
            stockLocationId
          }
        }
      }
    }
  }
`;
    return this.client.query<Partial<GetProductByIdQuery>>({ query, variables });
  }
}

export class GeneratedMutations {
  client: BaseGraphQLAPIClient<any>;

  constructor(client: BaseGraphQLAPIClient<any>) {
    this.client = client;
  }

  async createStorefrontJSScript(variables: CreateStorefrontJSScriptMutationVariables): Promise<APIResult<Partial<CreateStorefrontJSScriptMutation>>> {
    const mutation = `
  mutation createStorefrontJSScript($input: CreateStorefrontJSScriptInput!) {
    createStorefrontJSScript(input: $input) {
      id
      name
      storefrontId
      isHighPriority
      contentType
      scriptContent
    }
  }
`;
    return this.client.mutate<Partial<CreateStorefrontJSScriptMutation>>({ mutation, variables });
  }

  async updateStorefrontJSScript(variables: UpdateStorefrontJSScriptMutationVariables): Promise<APIResult<Partial<UpdateStorefrontJSScriptMutation>>> {
    const mutation = `
  mutation updateStorefrontJSScript($input: UpdateStorefrontJSScriptInput!) {
    updateStorefrontJSScript(input: $input) {
      id
      name
      storefrontId
      isHighPriority
      contentType
      scriptContent
    }
  }
`;
    return this.client.mutate<Partial<UpdateStorefrontJSScriptMutation>>({ mutation, variables });
  }

  async deleteStorefrontJSScript(): Promise<APIResult<Partial<DeleteStorefrontJSScriptMutation>>> {
    const mutation = `
  mutation deleteStorefrontJSScript {
    deleteStorefrontJSScript
  }
`;
    return this.client.mutate<Partial<DeleteStorefrontJSScriptMutation>>({ mutation });
  }

  async createCampaign(variables: CreateCampaignMutationVariables): Promise<APIResult<Partial<CreateCampaignMutation>>> {
    const mutation = `
  mutation createCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) {
      id
      title
      type
    }
  }
`;
    return this.client.mutate<Partial<CreateCampaignMutation>>({ mutation, variables });
  }

  async updateCampaign(variables: UpdateCampaignMutationVariables): Promise<APIResult<Partial<UpdateCampaignMutation>>> {
    const mutation = `
  mutation updateCampaign($input: UpdateCampaignInput!) {
    updateCampaign(input: $input) {
      id
      title
      type
    }
  }
`;
    return this.client.mutate<Partial<UpdateCampaignMutation>>({ mutation, variables });
  }

  async deleteCampaignList(variables: DeleteCampaignListMutationVariables): Promise<APIResult<Partial<DeleteCampaignListMutation>>> {
    const mutation = `
  mutation deleteCampaignList($idList: [String!]!) {
    deleteCampaignList(idList: $idList)
  }
`;
    return this.client.mutate<Partial<DeleteCampaignListMutation>>({ mutation, variables });
  }

  async saveWebhooks(variables: SaveWebhooksMutationVariables): Promise<APIResult<Partial<SaveWebhooksMutation>>> {
    const mutation = `
  mutation saveWebhooks($input: WebhookInput!) {
    saveWebhooks(input: $input) {
      id
      scope
      endpoint
    }
  }
`;
    return this.client.mutate<Partial<SaveWebhooksMutation>>({ mutation, variables });
  }

  async deleteWebhook(variables: DeleteWebhookMutationVariables): Promise<APIResult<Partial<DeleteWebhookMutation>>> {
    const mutation = `
  mutation deleteWebhook($scopes: [String!]!) {
    deleteWebhook(scopes: $scopes)
  }
`;
    return this.client.mutate<Partial<DeleteWebhookMutation>>({ mutation, variables });
  }
}

export class ikasAdminGraphQLAPIClient<TokenData> extends BaseGraphQLAPIClient<TokenData> {
  queries: GeneratedQueries;
  mutations: GeneratedMutations;

  constructor(options: BaseGraphQLAPIClientOptions<TokenData>) {
    super(options);
    this.queries = new GeneratedQueries(this);
    this.mutations = new GeneratedMutations(this);
  }
}
