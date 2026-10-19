import "server-only";
import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

// One public-read bucket for everything the site shows: avatars, covers, banners, logos.
// Postgres only stores the resulting URL; the bytes live in Neon Object Storage.
const BUCKET = "media";

export const MEDIA_BASE_URL = `${process.env.AWS_ENDPOINT_URL_S3}/${BUCKET}`;

export const files = new Files({ adapter: neon({ bucket: BUCKET, publicBaseUrl: MEDIA_BASE_URL }) });

export const IMAGE_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

export const mediaUrl = (key: string) => `${MEDIA_BASE_URL}/${key}`;

/** The object key for a URL in our bucket, or null for any other URL (Discord/Google avatars, pasted links). */
export function mediaKey(url: string | null | undefined) {
  if (!url || !url.startsWith(`${MEDIA_BASE_URL}/`)) return null;
  return url.slice(MEDIA_BASE_URL.length + 1);
}

/** Best-effort cleanup: a stale file left behind is harmless, a failed save is not. */
export async function deleteMedia(url: string | null | undefined) {
  const key = mediaKey(url);
  if (!key) return;
  try {
    await files.delete(key);
  } catch (error) {
    console.error("Failed to delete media", key, error);
  }
}
