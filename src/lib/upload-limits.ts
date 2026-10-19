// Shared by the upload button (early feedback) and the upload action (the real check)
const STILL = ["image/png", "image/jpeg", "image/webp"] as const;
const ANIMATED = [...STILL, "image/gif"] as const;

const MB = 1024 * 1024;

export const UPLOAD_LIMITS = {
  // Profile photos stay still images; GIFs are for product pages
  avatar: { maxBytes: 5 * MB, types: STILL, admin: false },
  product: { maxBytes: 8 * MB, types: ANIMATED, admin: true },
  banner: { maxBytes: 8 * MB, types: ANIMATED, admin: true },
  block: { maxBytes: 8 * MB, types: ANIMATED, admin: true },
  logo: { maxBytes: 2 * MB, types: STILL, admin: true },
} as const;

export type UploadKind = keyof typeof UPLOAD_LIMITS;

const LABELS: Record<string, string> = { "image/png": "PNG", "image/jpeg": "JPG", "image/webp": "WebP", "image/gif": "GIF" };

/** Value for <input accept>, e.g. "image/png,image/jpeg,image/webp" */
export const acceptFor = (kind: UploadKind) => UPLOAD_LIMITS[kind].types.join(",");

/** Human hint, e.g. "PNG, JPG, WebP · max 5 MB" */
export function uploadHint(kind: UploadKind) {
  const { types, maxBytes } = UPLOAD_LIMITS[kind];
  return `${types.map((t) => LABELS[t]).join(", ")} · max ${maxBytes / MB} MB`;
}

/** Error message for a file this kind doesn't accept, or null when it's fine. */
export function checkUpload(kind: UploadKind, type: string, size: number) {
  const { types, maxBytes } = UPLOAD_LIMITS[kind];
  if (!(types as readonly string[]).includes(type)) return `Only ${types.map((t) => LABELS[t]).join(", ")} images are allowed here`;
  if (size > maxBytes) return `Image must be under ${maxBytes / MB} MB`;
  return null;
}
