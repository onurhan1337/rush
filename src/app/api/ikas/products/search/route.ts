import { NextResponse } from 'next/server';
import { withMerchant } from '@/lib/api-route-helpers';
import { createProductLoader } from '@/lib/ikas-products';
import type { ResolvedProduct } from '@/lib/campaigns/product';

export type SearchProductsApiResponse = {
  products: ResolvedProduct[];
};

export const GET = withMerchant(async (request, context) => {
  const { searchParams } = new URL(request.url);
  const loader = createProductLoader(context.ikas, context.merchantId);
  const id = searchParams.get('id');

  if (id) {
    const product = await loader.byId(id);
    return NextResponse.json({ data: { products: product ? [product] : [] } });
  }

  const products = await loader.search((searchParams.get('q') ?? '').trim());
  return NextResponse.json({ data: { products } });
});
