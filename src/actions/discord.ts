"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { signIn } from "@/auth";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { getActionUser } from "@/lib/auth-guard";
import { revokeManagedRoles, syncDiscordMember } from "@/lib/discord";

export type DiscordResult = { ok: true; message: string } | { ok: false; error: string };

export async function discordSignInAction() {
  await signIn("discord", { redirectTo: "/dashboard" });
}

/** Signed-in users: Auth.js links the Discord account to the current user. */
export async function connectDiscordAction() {
  await signIn("discord", { redirectTo: "/dashboard/settings?discord=linked" });
}

export async function disconnectDiscordAction(): Promise<DiscordResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, user.id), eq(accounts.provider, "discord")),
  });
  if (!account) return { ok: false, error: "No Discord account linked" };

  // Don't lock people out: keep Discord if it's their only way to sign in
  const other = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, user.id), ne(accounts.provider, "discord")),
    columns: { provider: true },
  });
  if (!user.passwordHash && !other) {
    return { ok: false, error: "Discord is your only sign-in method. Set up another login before disconnecting." };
  }

  await revokeManagedRoles(account.providerAccountId);
  await db.delete(accounts).where(and(eq(accounts.userId, user.id), eq(accounts.provider, "discord")));
  await db.update(users).set({ discordUsername: null }).where(eq(users.id, user.id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Discord disconnected" };
}

export async function resyncMyDiscordAction(): Promise<DiscordResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const result = await syncDiscordMember(user.id);
  return result.ok ? { ok: true, message: result.message } : { ok: false, error: result.message };
}
