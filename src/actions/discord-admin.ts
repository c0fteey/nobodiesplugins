"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { discordRoleRules, discordSettings, discordSyncLog } from "@/db/schema";
import { assertAdmin } from "@/lib/auth-guard";
import { syncAllDiscordMembers } from "@/lib/discord";
import type { AdminResult } from "./admin";
import { admin } from "@/lang/admin";

const e = admin.errors;

// Discord IDs ("snowflakes") are 17-20 digit numbers
const snowflake = z.string().trim().regex(/^\d{17,20}$/, e.discordId);

const settingsSchema = z.object({
  guildId: snowflake.or(z.literal("")).transform((v) => v || null),
  enabled: z.boolean(),
  autoJoin: z.boolean(),
  removeRoles: z.boolean(),
});

export async function saveDiscordSettingsAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? e.invalidData };
  if (parsed.data.enabled && !parsed.data.guildId) return { ok: false, error: e.serverIdRequired };

  const values = { ...parsed.data, updatedAt: new Date() };
  await db.insert(discordSettings).values({ id: "main", ...values }).onConflictDoUpdate({ target: discordSettings.id, set: values });
  revalidatePath("/admin/discord");
  return { ok: true };
}

// At most one condition: a product, a site role, or neither ("every customer")
const ruleSchema = z.object({
  productId: z.uuid().nullable(),
  siteRole: z.string().min(1).max(40).nullable().default(null),
  roleId: snowflake,
});

export async function addDiscordRuleAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = ruleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? e.invalidData };
  const { roleId } = parsed.data;
  const productId = parsed.data.productId;
  const siteRole = productId ? null : parsed.data.siteRole;

  const clash = await db.query.discordRoleRules.findFirst({
    where: and(
      eq(discordRoleRules.roleId, roleId),
      productId ? eq(discordRoleRules.productId, productId) : isNull(discordRoleRules.productId),
      siteRole ? eq(discordRoleRules.siteRole, siteRole) : isNull(discordRoleRules.siteRole),
    ),
    columns: { id: true },
  });
  if (clash) return { ok: false, error: e.ruleExists };

  await db.insert(discordRoleRules).values({ productId, siteRole, roleId });
  revalidatePath("/admin/discord");
  return { ok: true };
}

export async function deleteDiscordRuleAction(id: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: e.invalidId };
  await db.delete(discordRoleRules).where(eq(discordRoleRules.id, parsed.data));
  revalidatePath("/admin/discord");
  return { ok: true };
}

export type SyncAllResult = { ok: true; total: number; synced: number } | { ok: false; error: string };

/** Re-applies every rule to every linked user, e.g. after adding a rule for existing buyers. */
export async function syncAllDiscordAction(): Promise<SyncAllResult> {
  await assertAdmin();
  const config = await db.query.discordSettings.findFirst();
  if (!config?.enabled || !config.guildId) return { ok: false, error: e.enableFirst };

  const { total, ok } = await syncAllDiscordMembers();
  revalidatePath("/admin/discord");
  return { ok: true, total, synced: ok };
}

export async function clearDiscordLogAction(): Promise<AdminResult> {
  await assertAdmin();
  await db.delete(discordSyncLog);
  revalidatePath("/admin/discord");
  return { ok: true };
}
