import { resolveProduct, type ResolvedProduct } from '@/lib/campaigns/product';
import type { AuthToken } from '@/models/auth-token';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

type IkasClient = ikasAdminGraphQLAPIClient<AuthToken>;

export async function searchProducts(
  ikas: IkasClient,
  merchantId: string,
  search: string,
  limit = 20,
): Promise<ResolvedProduct[]> {
  const response = await ikas.queries.searchProduct({
    search: search || undefined,
    pagination: { limit, page: 1 },
  });

  if (!response.isSuccess || !response.data?.listProduct?.data) return [];
  return response.data.listProduct.data.map((raw) => resolveProduct(raw, merchantId));
}

export async function getProduct(ikas: IkasClient, merchantId: string, id: string): Promise<ResolvedProduct | undefined> {
  const response = await ikas.queries.getProductById({ id: { eq: id } });
  const raw = response.isSuccess ? response.data?.listProduct?.data?.[0] : undefined;
  return raw ? resolveProduct(raw, merchantId) : undefined;
}

export async function getProducts(ikas: IkasClient, merchantId: string, ids: string[]): Promise<ResolvedProduct[]> {
  const products = await Promise.all(ids.map((id) => getProduct(ikas, merchantId, id)));
  return products.filter((product): product is ResolvedProduct => !!product);
}
