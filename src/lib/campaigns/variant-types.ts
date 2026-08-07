import { buildMedia, type IkasMedia } from '@/lib/ikas-image';
import type { ListVariantTypeQueryData } from '@/lib/ikas-client/generated/graphql';

export type VariantSelectionType = 'color' | 'choice';

export type VariantOption = {
  typeId: string;
  typeName: string;
  valueId: string;
  valueName: string;
};

export type ResolvedVariantValue = {
  id: string;
  name: string;
  colorCode?: string;
  media?: IkasMedia;
};

export type ResolvedVariantType = {
  id: string;
  name: string;
  selectionType: VariantSelectionType;
  values: ResolvedVariantValue[];
};

export type VariantTypeCatalog = Map<string, ResolvedVariantType>;

export function buildVariantTypeCatalog(raw: ListVariantTypeQueryData, merchantId: string): VariantTypeCatalog {
  return new Map(
    raw.map((type) => [
      type.id,
      {
        id: type.id,
        name: type.name,
        selectionType: type.selectionType === 'COLOR' ? ('color' as const) : ('choice' as const),
        values: type.values.map((value) => ({
          id: value.id,
          name: value.name,
          colorCode: value.colorCode ?? undefined,
          media: buildMedia({ imageId: value.thumbnailImageId }, merchantId),
        })),
      },
    ]),
  );
}

function orderedTypeIds(variants: Array<{ options: VariantOption[] }>): string[] {
  const ids: string[] = [];
  for (const variant of variants) {
    for (const option of variant.options) {
      if (!ids.includes(option.typeId)) ids.push(option.typeId);
    }
  }
  return ids;
}

function usedValueIds(options: VariantOption[]): string[] {
  const ids: string[] = [];
  for (const option of options) {
    if (!ids.includes(option.valueId)) ids.push(option.valueId);
  }
  return ids;
}

export function narrowVariantTypes(types: ResolvedVariantType[], variants: Array<{ options: VariantOption[] }>): ResolvedVariantType[] {
  const options = variants.flatMap((variant) => variant.options);

  return types
    .map((type) => ({
      ...type,
      values: type.values.filter((value) => options.some((option) => option.typeId === type.id && option.valueId === value.id)),
    }))
    .filter((type) => type.values.length > 1);
}

export function resolveVariantTypes(variants: Array<{ options: VariantOption[] }>, catalog: VariantTypeCatalog): ResolvedVariantType[] {
  const allOptions = variants.flatMap((variant) => variant.options);

  return orderedTypeIds(variants).map((typeId) => {
    const options = allOptions.filter((option) => option.typeId === typeId);
    const type = catalog.get(typeId);

    return {
      id: typeId,
      name: type?.name ?? options[0]?.typeName ?? '',
      selectionType: type?.selectionType ?? 'choice',
      values: usedValueIds(options).map((valueId) => {
        const known = type?.values.find((value) => value.id === valueId);
        return known ?? { id: valueId, name: options.find((option) => option.valueId === valueId)?.valueName ?? '' };
      }),
    };
  });
}
