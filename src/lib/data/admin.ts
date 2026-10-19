import "server-only";
import { asc, count, desc, eq, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  campaigns,
  contactMessages,
  coupons,
  discordRoleRules,
  discordSyncLog,
  docPages,
  faqs,
  orderItems,
  orders,
  partners,
  products,
  roles,
  settings,
  users,
} from "@/db/schema";
import { normalizeSettings } from "./store";

// Admin reads are never cached: the panel must always show the latest state

export async function getAdminStats() {
  const [[revenue], [orderCount], [userCount], [productCount], [openMessages]] = await Promise.all([
    db.select({ value: sum(orders.totalCents) }).from(orders).where(eq(orders.status, "completed")),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.handled, false)),
  ]);
  return {
    revenueCents: Number(revenue.value ?? 0),
    orders: orderCount.value,
    users: userCount.value,
    products: productCount.value,
    openMessages: openMessages.value,
  };
}

export async function getAllProducts() {
  return db.select().from(products).orderBy(asc(products.type), asc(products.sortOrder), asc(products.name));
}

export async function getProductById(id: string) {
  return (await db.query.products.findFirst({ where: eq(products.id, id) })) ?? null;
}

export async function getAllDocs() {
  return db.select().from(docPages).orderBy(asc(docPages.sortOrder), asc(docPages.title));
}

export async function getDocById(id: string) {
  return (await db.query.docPages.findFirst({ where: eq(docPages.id, id) })) ?? null;
}

export async function getAllFaqs() {
  return db.select().from(faqs).orderBy(asc(faqs.sortOrder));
}

export async function getAllPartners() {
  return db.select().from(partners).orderBy(asc(partners.sortOrder));
}

export async function getRecentOrders(limit = 50) {
  const rows = await db
    .select({ order: orders, email: users.email })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  const items = await db
    .select({ orderId: orderItems.orderId, name: products.name })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId));

  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.order.id).map((i) => i.name) }));
}

export async function getUsers() {
  const orderCounts = db
    .select({ userId: orders.userId, orders: count().as("orders"), spent: sum(orders.totalCents).as("spent") })
    .from(orders)
    .groupBy(orders.userId)
    .as("oc");

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      discordUsername: users.discordUsername,
      createdAt: users.createdAt,
      orders: orderCounts.orders,
      spent: orderCounts.spent,
    })
    .from(users)
    .leftJoin(orderCounts, eq(orderCounts.userId, users.id))
    .orderBy(desc(users.createdAt));
}

/** userId -> ids of products they own (completed or not), for the admin "products" dialog. */
export async function getOwnership() {
  const rows = await db
    .selectDistinct({ userId: orders.userId, productId: orderItems.productId })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId));
  const map = new Map<string, string[]>();
  for (const r of rows) map.set(r.userId, [...(map.get(r.userId) ?? []), r.productId]);
  return map;
}

export async function getDiscordRules() {
  return db
    .select({
      id: discordRoleRules.id,
      roleId: discordRoleRules.roleId,
      productId: discordRoleRules.productId,
      productName: products.name,
      siteRole: discordRoleRules.siteRole,
      siteRoleName: roles.name,
    })
    .from(discordRoleRules)
    .leftJoin(products, eq(products.id, discordRoleRules.productId))
    .leftJoin(roles, eq(roles.key, discordRoleRules.siteRole))
    .orderBy(asc(products.name), asc(discordRoleRules.createdAt));
}

export async function getDiscordLog(limit = 30) {
  return db
    .select({ id: discordSyncLog.id, ok: discordSyncLog.ok, message: discordSyncLog.message, createdAt: discordSyncLog.createdAt, email: users.email, discordUsername: users.discordUsername })
    .from(discordSyncLog)
    .leftJoin(users, eq(users.id, discordSyncLog.userId))
    .orderBy(desc(discordSyncLog.createdAt))
    .limit(limit);
}

export async function getDiscordLinkedCount() {
  const [row] = await db.select({ value: count() }).from(accounts).where(eq(accounts.provider, "discord"));
  return row.value;
}

export async function getMessages() {
  return db.select().from(contactMessages).orderBy(asc(contactMessages.handled), desc(contactMessages.createdAt));
}

export async function getRawSettings() {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "site") });
  return normalizeSettings(row?.value);
}

export async function getCoupons() {
  const rows = await db
    .select({ coupon: coupons, ownerEmail: users.email })
    .from(coupons)
    .leftJoin(users, eq(users.id, coupons.userId))
    .orderBy(desc(coupons.createdAt));
  const now = Date.now();
  return rows.map((r) => ({ ...r, expired: !!r.coupon.expiresAt && r.coupon.expiresAt.getTime() <= now }));
}

export async function getCouponById(id: string) {
  const [row] = await db
    .select({ coupon: coupons, ownerEmail: users.email })
    .from(coupons)
    .leftJoin(users, eq(users.id, coupons.userId))
    .where(eq(coupons.id, id));
  return row ?? null;
}

export async function getAllCampaigns() {
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: string) {
  return (await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) })) ?? null;
}
