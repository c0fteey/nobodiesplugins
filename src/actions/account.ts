"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getActionUser } from "@/lib/auth-guard";
import { changePasswordSchema, profileSchema } from "@/lib/validations/auth";
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

export async function updatePreferencesAction(input: unknown): Promise<AccountResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: site.common.notSignedIn };

  const parsed = z.object({ marketingEmails: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: site.common.invalidData };

  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  return { ok: true, message: t.prefsSaved };
}
