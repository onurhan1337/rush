import { resolveProduct, type ResolvedProduct } from '@/lib/campaigns/product';
import { buildVariantTypeCatalog, type VariantTypeCatalog } from '@/lib/campaigns/variant-types';
import { listStorefronts } from '@/lib/storefront-script';
import type { Currency } from '@/lib/money';
import type { AuthToken } from '@/models/auth-token';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

type IkasClient = ikasAdminGraphQLAPIClient<AuthToken>;

type StoreDefaults = {
  catalog: VariantTypeCatalog;
  currency: Currency;
};

export type ProductLoader = {
  search: (query: string, limit?: number) => Promise<ResolvedProduct[]>;
  byId: (id: string) => Promise<ResolvedProduct | undefined>;
  byIds: (ids: string[]) => Promise<ResolvedProduct[]>;
};

async function loadVariantTypes(ikas: IkasClient, merchantId: string): Promise<VariantTypeCatalog> {
  try {
    const response = await ikas.queries.listVariantType();
    if (!response.isSuccess || !response.data?.listVariantType) return new Map();
    return buildVariantTypeCatalog(response.data.listVariantType, merchantId);
  } catch {
    return new Map();
  }
}

async function loadStoreCurrency(ikas: IkasClient): Promise<Currency> {
  try {
    const storefronts = await listStorefronts(ikas);
    const priced = storefronts.find((storefront) => storefront.currencyCode || storefront.currencySymbol);
    return { code: priced?.currencyCode, symbol: priced?.currencySymbol };
  } catch {
    return {};
  }
}

export function createProductLoader(ikas: IkasClient, merchantId: string): ProductLoader {
  const cache = new Map<string, Promise<ResolvedProduct | undefined>>();
  let defaultsPromise: Promise<StoreDefaults> | null = null;

  const defaults = () => {
    if (!defaultsPromise) {
      defaultsPromise = Promise.all([loadVariantTypes(ikas, merchantId), loadStoreCurrency(ikas)]).then(([catalog, currency]) => ({
        catalog,
        currency,
      }));
    }
    return defaultsPromise;
  };

  const search = async (query: string, limit = 20) => {
    const [response, store] = await Promise.all([
      ikas.queries.searchProduct({ search: query || undefined, pagination: { limit, page: 1 } }),
      defaults(),
    ]);

    if (!response.isSuccess || !response.data?.listProduct?.data) return [];
    return response.data.listProduct.data.map((raw) => resolveProduct(raw, merchantId, store.catalog, store.currency));
  };

  const load = async (id: string) => {
    const [response, store] = await Promise.all([ikas.queries.getProductById({ id: { eq: id } }), defaults()]);
    const raw = response.isSuccess ? response.data?.listProduct?.data?.[0] : undefined;
    return raw ? resolveProduct(raw, merchantId, store.catalog, store.currency) : undefined;
  };

  const byId = (id: string) => {
    const cached = cache.get(id);
    if (cached) return cached;

    const pending = load(id);
    cache.set(id, pending);
    return pending;
  };

  const byIds = async (ids: string[]) => {
    const products = await Promise.all(ids.map(byId));
    return products.filter((product): product is ResolvedProduct => !!product);
  };

  return { search, byId, byIds };
}
