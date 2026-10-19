import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { roles, users } from "@/db/schema";

/** All roles in display order (built-in "user" first, "admin" last by default). */
export async function getRoles() {
  return db.select().from(roles).orderBy(asc(roles.sortOrder), asc(roles.name));
}

/** Roles with how many users hold each one, for the admin roles page. */
export async function getRolesWithCounts() {
  const counts = db
    .select({ role: users.role, users: count().as("users") })
    .from(users)
    .groupBy(users.role)
    .as("rc");
  return db
    .select({ role: roles, users: counts.users })
    .from(roles)
    .leftJoin(counts, eq(counts.role, roles.key))
    .orderBy(asc(roles.sortOrder), asc(roles.name));
}

export async function getRoleByKey(key: string) {
  return (await db.query.roles.findFirst({ where: eq(roles.key, key) })) ?? null;
}
