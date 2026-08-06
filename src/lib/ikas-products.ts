import { resolveProduct, type ResolvedProduct } from '@/lib/campaigns/product';
import type { AuthToken } from '@/models/auth-token';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

type IkasClient = ikasAdminGraphQLAPIClient<AuthToken>;

export async function searchProducts(ikas: IkasClient, search: string, limit = 20): Promise<ResolvedProduct[]> {
  const response = await ikas.queries.searchProduct({
    search: search || undefined,
    pagination: { limit, page: 1 },
  });

  if (!response.isSuccess || !response.data?.listProduct?.data) return [];
  return response.data.listProduct.data.map(resolveProduct);
}

export async function getProduct(ikas: IkasClient, id: string): Promise<ResolvedProduct | undefined> {
  const response = await ikas.queries.getProductById({ id: { eq: id } });
  const raw = response.isSuccess ? response.data?.listProduct?.data?.[0] : undefined;
  return raw ? resolveProduct(raw) : undefined;
}
