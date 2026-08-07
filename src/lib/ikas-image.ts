export type IkasMedia = {
  url: string;
  isVideo: boolean;
  srcSet?: string;
};

export type IkasMediaSource = {
  imageId?: string | null;
  fileName?: string | null;
  isVideo?: boolean | null;
};

const IMAGE_CDN = process.env.IKAS_CDN_URL ?? 'https://cdn.myikas.com/';
const VIDEO_CDN = process.env.IKAS_VIDEO_CDN_URL ?? 'https://videocdn.myikas.com/';
const SRCSET_SIZES = [180, 360, 540, 720];
const DEFAULT_SIZE = 360;

function mediaPath(imageId: string, merchantId: string): string {
  return imageId.includes('/') ? imageId : `${merchantId}/${imageId}`;
}

function imageUrl(path: string, fileName: string | null | undefined, size: number): string {
  return fileName
    ? `${IMAGE_CDN}images/${path}/${size}/${fileName}.webp`
    : `${IMAGE_CDN}images/${path}/image_${size}.webp`;
}

export function buildMedia(source: IkasMediaSource | undefined, merchantId: string): IkasMedia | undefined {
  if (!source?.imageId) return undefined;

  const path = mediaPath(source.imageId, merchantId);
  if (source.isVideo) return { url: `${VIDEO_CDN}videos/${path}/original.mp4`, isVideo: true };

  return {
    url: imageUrl(path, source.fileName, DEFAULT_SIZE),
    isVideo: false,
    srcSet: SRCSET_SIZES.map((size) => `${imageUrl(path, source.fileName, size)} ${size}w`).join(', '),
  };
}
