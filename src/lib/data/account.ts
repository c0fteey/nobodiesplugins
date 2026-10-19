import "server-only";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { couponRedemptions, coupons, licenses, orderItems, orders, products } from "@/db/schema";

/** Product ids the user owns through completed orders. */
export async function getOwnedProductIds(userId: string) {
  const rows = await db
    .select({ productId: orderItems.productId })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orders.userId, userId));
  return new Set(rows.map((r) => r.productId));
}

export async function getPurchases(userId: string) {
  return db
    .select({
      product: products,
      acquiredAt: orders.createdAt,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrdersWithItems(userId: string) {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
  if (userOrders.length === 0) return [];

  const items = await db
    .select({ orderId: orderItems.orderId, name: products.name })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(inArray(orderItems.orderId, userOrders.map((o) => o.id)));

  return userOrders.map((o) => ({
    ...o,
    productNames: items.filter((i) => i.orderId === o.id).map((i) => i.name),
  }));
}

export async function getLicenses(userId: string) {
  return db
    .select({ license: licenses, productName: products.name })
    .from(licenses)
    .innerJoin(products, eq(products.id, licenses.productId))
    .where(eq(licenses.userId, userId))
    .orderBy(desc(licenses.createdAt));
}

/** Licenses whose server phoned home in the last 10 minutes. */
export function countConnected(rows: { license: { lastSeenAt: Date | null } }[]) {
  const cutoff = Date.now() - 10 * 60_000;
  return rows.filter((r) => r.license.lastSeenAt && r.license.lastSeenAt.getTime() > cutoff).length;
}

/** Live coupons locked to this account, with how many uses are left for them. */
export async function getAccountCoupons(userId: string) {
  const rows = await db.select().from(coupons).where(and(eq(coupons.userId, userId), eq(coupons.active, true)));
  if (rows.length === 0) return [];

  const used = await db
    .select({ couponId: couponRedemptions.couponId, uses: count() })
    .from(couponRedemptions)
    .where(and(eq(couponRedemptions.userId, userId), inArray(couponRedemptions.couponId, rows.map((c) => c.id))))
    .groupBy(couponRedemptions.couponId);
  const usedBy = new Map(used.map((u) => [u.couponId, u.uses]));

  const now = Date.now();
  return rows
    .filter((c) => (!c.startsAt || c.startsAt.getTime() <= now) && (!c.expiresAt || c.expiresAt.getTime() > now))
    .filter((c) => c.maxUses == null || c.usesCount < c.maxUses)
    .map((c) => ({ ...c, usesLeft: c.perUserLimit - (usedBy.get(c.id) ?? 0) }))
    .filter((c) => c.usesLeft > 0);
}
