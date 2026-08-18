import { NextResponse } from 'next/server';
import { withMerchant } from '@/lib/api-route-helpers';
import { searchCategories, type ResolvedCategory } from '@/lib/ikas-categories';

export type SearchCategoriesApiResponse = {
  categories: ResolvedCategory[];
};

export const GET = withMerchant(async (request, context) => {
  const { searchParams } = new URL(request.url);
  const categories = await searchCategories(context.ikas, (searchParams.get('q') ?? '').trim());
  return NextResponse.json({ data: { categories } });
});
