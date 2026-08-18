import axios from 'axios';
import { GetMerchantApiResponse } from '../app/api/ikas/get-merchant/route';
import { ApiResponseType } from '../globals/constants';
import type { CreateCampaignApiResponse, ListCampaignsApiResponse } from '../app/api/ikas/campaigns/route';
import type { GetCampaignApiResponse } from '../app/api/ikas/campaigns/[id]/route';
import type { PublishCampaignApiResponse } from '../app/api/ikas/campaigns/[id]/publish/route';
import type { SearchCategoriesApiResponse } from '../app/api/ikas/categories/search/route';
import type { SearchProductsApiResponse } from '../app/api/ikas/products/search/route';
import type { ScriptStatusApiResponse } from '../app/api/ikas/script/route';
import type { StatsApiResponse } from '../app/api/ikas/stats/route';
import type { ScopeApiResponse } from '../app/api/ikas/scope/route';
import type { CampaignWriteInput } from './campaigns/api-schema';

export async function makePostRequest<T>({ url, data, token }: { url: string; data?: any; token?: string }) {
  return axios.post<ApiResponseType<T>>(url, data, {
    headers: token
      ? {
          Authorization: `JWT ${token}`,
        }
      : undefined,
  });
}

export async function makeGetRequest<T>({ url, data, token }: { url: string; data?: any; token?: string }) {
  return axios.get<ApiResponseType<T>>(url, {
    params: data,
    headers: token
      ? {
          Authorization: `JWT ${token}`,
        }
      : undefined,
  });
}

export async function makePatchRequest<T>({ url, data, token }: { url: string; data?: any; token?: string }) {
  return axios.patch<ApiResponseType<T>>(url, data, {
    headers: token ? { Authorization: `JWT ${token}` } : undefined,
  });
}

export async function makeDeleteRequest<T>({ url, token }: { url: string; token?: string }) {
  return axios.delete<ApiResponseType<T>>(url, {
    headers: token ? { Authorization: `JWT ${token}` } : undefined,
  });
}

export const ApiRequests = {
  ikas: {
    getMerchant: (token: string) => makeGetRequest<GetMerchantApiResponse>({ url: '/api/ikas/get-merchant', token }),

    listCampaigns: (token: string) => makeGetRequest<ListCampaignsApiResponse>({ url: '/api/ikas/campaigns', token }),
    createCampaign: (token: string, data: Partial<CampaignWriteInput>) =>
      makePostRequest<CreateCampaignApiResponse>({ url: '/api/ikas/campaigns', token, data }),
    getCampaign: (token: string, id: string) => makeGetRequest<GetCampaignApiResponse>({ url: `/api/ikas/campaigns/${id}`, token }),
    updateCampaign: (token: string, id: string, data: Partial<CampaignWriteInput>) =>
      makePatchRequest<GetCampaignApiResponse>({ url: `/api/ikas/campaigns/${id}`, token, data }),
    deleteCampaign: (token: string, id: string) => makeDeleteRequest<{ deleted: boolean }>({ url: `/api/ikas/campaigns/${id}`, token }),
    publishCampaign: (token: string, id: string, action: 'publish' | 'pause') =>
      makePostRequest<PublishCampaignApiResponse>({ url: `/api/ikas/campaigns/${id}/publish`, token, data: { action } }),

    searchProducts: (token: string, params: { q?: string; id?: string }) =>
      makeGetRequest<SearchProductsApiResponse>({ url: '/api/ikas/products/search', token, data: params }),

    searchCategories: (token: string, params: { q?: string }) =>
      makeGetRequest<SearchCategoriesApiResponse>({ url: '/api/ikas/categories/search', token, data: params }),

    getScript: (token: string) => makeGetRequest<ScriptStatusApiResponse>({ url: '/api/ikas/script', token }),
    installScript: (token: string) => makePostRequest<ScriptStatusApiResponse>({ url: '/api/ikas/script', token }),
    uninstallScript: (token: string) => makeDeleteRequest<ScriptStatusApiResponse>({ url: '/api/ikas/script', token }),

    getStats: (token: string, params?: { campaignId?: string; range?: number }) =>
      makeGetRequest<StatsApiResponse>({ url: '/api/ikas/stats', token, data: params }),

    getScope: (token: string) => makeGetRequest<ScopeApiResponse>({ url: '/api/ikas/scope', token }),
  },
};
