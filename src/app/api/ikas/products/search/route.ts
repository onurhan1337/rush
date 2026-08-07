import { NextResponse } from 'next/server';
import { withMerchant } from '@/lib/api-route-helpers';
import { getProduct, searchProducts } from '@/lib/ikas-products';
import type { ResolvedProduct } from '@/lib/campaigns/product';

export type SearchProductsApiResponse = {
  products: ResolvedProduct[];
};

export const GET = withMerchant(async (request, context) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const product = await getProduct(context.ikas, context.merchantId, id);
    return NextResponse.json({ data: { products: product ? [product] : [] } });
  }

  const query = searchParams.get('q') ?? '';
  const products = await searchProducts(context.ikas, context.merchantId, query.trim());
  return NextResponse.json({ data: { products } });
});
