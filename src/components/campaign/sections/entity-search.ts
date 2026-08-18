'use client';

import { useCallback } from 'react';
import { ApiRequests } from '@/lib/api-requests';
import type { EntityRef } from '@/lib/campaigns/rules/types';

export function useProductRefSearch(token: string) {
  return useCallback(
    async (query: string): Promise<EntityRef[]> => {
      const response = await ApiRequests.ikas.searchProducts(token, { q: query });
      const products = response.data?.data?.products ?? [];
      return products.map((product) => ({ id: product.id, name: product.name, slug: product.slug ?? '' }));
    },
    [token],
  );
}

export function useCategoryRefSearch(token: string) {
  return useCallback(
    async (query: string): Promise<EntityRef[]> => {
      const response = await ApiRequests.ikas.searchCategories(token, { q: query });
      const categories = response.data?.data?.categories ?? [];
      return categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug }));
    },
    [token],
  );
}
