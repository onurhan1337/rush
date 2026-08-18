import type { AuthToken } from '@/models/auth-token';
import type { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';

type IkasClient = ikasAdminGraphQLAPIClient<AuthToken>;

export type ResolvedCategory = {
  id: string;
  name: string;
  slug: string;
};

export async function searchCategories(ikas: IkasClient, query: string, limit = 20): Promise<ResolvedCategory[]> {
  const response = await ikas.queries.searchCategory({ search: query || undefined });
  if (!response.isSuccess || !response.data?.listCategory) return [];

  return response.data.listCategory
    .filter((category) => !category.deleted && !!category.metaData?.slug)
    .map((category) => ({ id: category.id, name: category.name, slug: category.metaData?.slug ?? '' }))
    .slice(0, limit);
}
