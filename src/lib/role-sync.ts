import "server-only";
import { and, count, eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { orders, roles, users, type Role } from "@/db/schema";

/** The auto role a buyer qualifies for: highest threshold reached, or "user" with no completed order. */
function pickAutoRole(allRoles: Role[], spentCents: number, orderCount: number) {
  if (orderCount === 0) return "user";
  const reached = allRoles
    .filter((r) => r.minSpendCents != null && spentCents >= r.minSpendCents)
    .sort((a, b) => b.minSpendCents! - a.minSpendCents!);
  return reached[0]?.key ?? "user";
}

/**
 * Moves a user between "user" and the auto roles (roles with a spend threshold)
 * based on their completed orders. Admins and manually given custom roles are left alone.
 * Returns the user's role afterwards.
 */
export async function syncUserRole(userId: string, allRoles?: Role[]) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { role: true } });
  if (!user) return null;

  const list = allRoles ?? (await db.select().from(roles));
  const current = list.find((r) => r.key === user.role);
  const managed = user.role === "user" || current?.minSpendCents != null;
  if (!managed) return user.role;

  const [stats] = await db
    .select({ spent: sum(orders.totalCents), orders: count() })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, "completed")));
  const next = pickAutoRole(list, Number(stats.spent ?? 0), stats.orders);

  if (next !== user.role) await db.update(users).set({ role: next }).where(eq(users.id, userId));
  return next;
}

/** Re-applies thresholds to everyone, e.g. after an admin changes them. Returns how many changed. */
export async function syncAllUserRoles() {
  const list = await db.select().from(roles);
  const everyone = await db.select({ id: users.id, role: users.role }).from(users);
  let changed = 0;
  for (const u of everyone) {
    if ((await syncUserRole(u.id, list)) !== u.role) changed++;
  }
  return changed;
}
