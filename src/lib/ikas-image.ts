export type IkasImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'original';

const CDN_BASE = 'https://cdn.myikas.com/images';

export function buildImageUrl(imageId: string | null | undefined, size: IkasImageSize = 'sm'): string | undefined {
  if (!imageId) return undefined;
  return `${CDN_BASE}/${imageId}/image_${size}.webp`;
}
