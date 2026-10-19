import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";

/** Current user row (fresh from the DB, so role changes apply immediately). Deduped per request. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return null;
  return (await db.query.users.findFirst({ where: eq(users.id, userId) })) ?? null;
});

/** For pages: redirect guests to the login page. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages: only admins get through. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

/** For server actions: never trust the client, re-check on every call. */
export async function getActionUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return (await db.query.users.findFirst({ where: eq(users.id, userId) })) ?? null;
}

export async function assertAdmin() {
  const user = await getActionUser();
  if (user?.role !== "admin") throw new Error("Unauthorized");
  return user;
}
