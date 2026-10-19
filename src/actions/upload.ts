"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { SignedUpload } from "files-sdk";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getActionUser } from "@/lib/auth-guard";
import { deleteMedia, files, IMAGE_TYPES, mediaKey, mediaUrl, type ImageType } from "@/lib/storage";
import { checkUpload, UPLOAD_LIMITS, type UploadKind } from "@/lib/upload-limits";

export type UploadTicket = { ok: true; url: string; upload: SignedUpload } | { ok: false; error: string };

const ticketSchema = z.object({
  kind: z.enum(Object.keys(UPLOAD_LIMITS) as [UploadKind, ...UploadKind[]]),
  contentType: z.enum(Object.keys(IMAGE_TYPES) as [ImageType, ...ImageType[]], "Only PNG, JPG, GIF and WebP images"),
  size: z.number().int().positive(),
});

/**
 * Hands out a 60-second signed upload for one image. The browser then sends the
 * file straight to the bucket; the size cap is enforced there by the POST policy.
 */
export async function createUploadAction(input: unknown): Promise<UploadTicket> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: "Please log in first" };

  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file" };
  const { kind, contentType, size } = parsed.data;

  const limit = UPLOAD_LIMITS[kind];
  if (limit.admin && user.role !== "admin") return { ok: false, error: "Unauthorized" };
  const invalid = checkUpload(kind, contentType, size);
  if (invalid) return { ok: false, error: invalid };

  // A fresh key per upload, so caches never serve an old version
  const key = `${kind}/${user.id}/${crypto.randomUUID()}.${IMAGE_TYPES[contentType]}`;
  const upload = await files.signedUploadUrl(key, { expiresIn: 60, contentType, maxSize: limit.maxBytes });
  return { ok: true, url: mediaUrl(key), upload };
}

export type AvatarResult = { ok: true; image: string | null } | { ok: false; error: string };

export async function saveAvatarAction(url: unknown): Promise<AvatarResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Only accept files this user uploaded through createUploadAction
  const key = mediaKey(typeof url === "string" ? url : null);
  if (!key?.startsWith(`avatar/${user.id}/`) || !(await files.exists(key))) {
    return { ok: false, error: "Upload not found, please try again" };
  }

  await db.update(users).set({ image: mediaUrl(key) }).where(eq(users.id, user.id));
  await deleteMedia(user.image);
  revalidatePath("/dashboard", "layout");
  return { ok: true, image: mediaUrl(key) };
}

export async function removeAvatarAction(): Promise<AvatarResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: "Not signed in" };

  await db.update(users).set({ image: null }).where(eq(users.id, user.id));
  await deleteMedia(user.image);
  revalidatePath("/dashboard", "layout");
  return { ok: true, image: null };
}
