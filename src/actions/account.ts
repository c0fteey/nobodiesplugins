"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products, users } from "@/db/schema";
import { getActionUser } from "@/lib/auth-guard";
import { changePasswordSchema, profileSchema } from "@/lib/validations/auth";
import { issueLicenses, regenerateLicenseKey } from "@/lib/licenses";
import { getOwnedProductIds } from "@/lib/data/account";
import { site } from "@/lang/site";

const t = site.settings.results;

export type AccountResult = { ok: true; message: string } | { ok: false; error: string };

export async function updateProfileAction(input: unknown): Promise<AccountResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: site.common.notSignedIn };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? site.common.invalidData };

  const taken = await db.query.users.findFirst({
    where: and(eq(users.email, parsed.data.email), ne(users.id, user.id)),
    columns: { id: true },
  });
  if (taken) return { ok: false, error: t.emailInUse };

  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: t.profileSaved };
}

export async function changePasswordAction(input: unknown): Promise<AccountResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: site.common.notSignedIn };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? site.common.invalidData };

  if (!user.passwordHash || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { ok: false, error: t.wrongPassword };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  return { ok: true, message: t.passwordUpdated };
}

/** For owned plugins that have no key yet (e.g. bought before licensing was turned on). */
export async function createMyLicenseAction(productId: unknown): Promise<AccountResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: site.common.notSignedIn };
  const parsed = z.uuid().safeParse(productId);
  if (!parsed.success) return { ok: false, error: site.common.invalidData };

  const product = await db.query.products.findFirst({ where: eq(products.id, parsed.data) });
  if (!product || !product.requiresLicense || product.type === "addon") return { ok: false, error: site.licenses.notNeeded };
  if (!(await getOwnedProductIds(user.id)).has(product.id)) return { ok: false, error: site.licenses.notOwned };

  await issueLicenses(db, user.id, [product]);
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: site.licenses.created };
}

/** The owner can swap a leaked key for a new one; the old key stops verifying. */
export async function regenerateMyLicenseAction(id: unknown): Promise<AccountResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: site.common.notSignedIn };
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success || !(await regenerateLicenseKey(parsed.data, user.id))) return { ok: false, error: site.common.invalidData };
  revalidatePath("/dashboard/licenses");
  return { ok: true, message: site.licenses.regenerated };
}

export async function updatePreferencesAction(input: unknown): Promise<AccountResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: site.common.notSignedIn };

  const parsed = z.object({ marketingEmails: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: site.common.invalidData };

  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  return { ok: true, message: t.prefsSaved };
}
