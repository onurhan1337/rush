import { gql } from 'graphql-request';

export const GET_MERCHANT = gql`
  query getMerchant {
    getMerchant {
      id
      email
      storeName
    }
  }
`;

export const GET_AUTHORIZED_APP = gql`
  query getAuthorizedApp {
    getAuthorizedApp {
      id
      salesChannelId
    }
  }
`;

export const LIST_STOREFRONT = gql`
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

export const LIST_VARIANT_TYPE = gql`
  query listVariantType {
    listVariantType {
      id
      name
      selectionType
      values {
        id
        name
        colorCode
        thumbnailImageId
      }
    }
  }
`;

export const SEARCH_PRODUCT = gql`
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

export const GET_PRODUCT_BY_ID = gql`
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

export const CREATE_STOREFRONT_JS_SCRIPT = gql`
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

export const UPDATE_STOREFRONT_JS_SCRIPT = gql`
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

export const DELETE_STOREFRONT_JS_SCRIPT = gql`
  mutation deleteStorefrontJSScript {
    deleteStorefrontJSScript
  }
`;

export const CREATE_CAMPAIGN = gql`
  mutation createCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) {
      id
      title
      type
    }
  }
`;

export const UPDATE_CAMPAIGN = gql`
  mutation updateCampaign($input: UpdateCampaignInput!) {
    updateCampaign(input: $input) {
      id
      title
      type
    }
  }
`;

export const DELETE_CAMPAIGN_LIST = gql`
  mutation deleteCampaignList($idList: [String!]!) {
    deleteCampaignList(idList: $idList)
  }
`;

export const SAVE_WEBHOOKS = gql`
  mutation saveWebhooks($input: WebhookInput!) {
    saveWebhooks(input: $input) {
      id
      scope
      endpoint
    }
  }
`;

export const DELETE_WEBHOOK = gql`
  mutation deleteWebhook($scopes: [String!]!) {
    deleteWebhook(scopes: $scopes)
  }
`;
