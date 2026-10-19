"use server";

import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  campaigns,
  contactMessages,
  coupons,
  docPages,
  faqs,
  licenses,
  orderItems,
  orders,
  partners,
  products,
  roles,
  settings,
  users,
  type SiteSettings,
} from "@/db/schema";
import { getOwnedProductIds } from "@/lib/data/account";
import { syncDiscordMember } from "@/lib/discord";
import { syncAllUserRoles, syncUserRole } from "@/lib/role-sync";
import { backfillLicenses, deleteLicenses, issueLicenses, regenerateLicenseKey } from "@/lib/licenses";
import { slugify } from "@/lib/format";
import { admin } from "@/lang/admin";
import { assertAdmin } from "@/lib/auth-guard";
import {
  campaignSchema,
  couponSchema,
  docSchema,
  faqSchema,
  partnerSchema,
  productSchema,
  seoSchema,
  settingsSchema,
} from "@/lib/validations/store";

const e = admin.errors;

export type AdminResult = { ok: true; id?: string } | { ok: false; error: string };

const idSchema = z.uuid();
const toCents = (euros: number) => Math.round(euros * 100);
const list = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

function fail(error: z.ZodError): AdminResult {
  const issue = error.issues[0];
  return { ok: false, error: issue ? `${issue.path.join(".") || e.form}: ${issue.message}` : e.invalidData };
}

// Every admin mutation: auth check -> zod -> write -> invalidate public caches

export async function saveProductAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const p = parsed.data;

  const clash = await db.query.products.findFirst({
    where: p.id ? and(eq(products.slug, p.slug), ne(products.id, p.id)) : eq(products.slug, p.slug),
    columns: { id: true },
  });
  if (clash) return { ok: false, error: e.slugTaken };

  const values = {
    name: p.name,
    slug: p.slug,
    type: p.type,
    parentId: p.type === "addon" ? (p.parentId ?? null) : null,
    tagline: p.tagline || null,
    shortDescription: p.shortDescription,
    description: p.description,
    priceCents: toCents(p.price),
    compareAtCents: p.compareAt ? toCents(p.compareAt) : null,
    badge: p.badge === "none" ? null : p.badge,
    imageUrl: p.imageUrl,
    downloadUrl: p.downloadUrl,
    // Add-ons run on their plugin's license, so they never get keys of their own
    requiresLicense: p.type !== "addon" && p.requiresLicense,
    accentFrom: p.accentFrom,
    accentTo: p.accentTo,
    artTitle: p.artTitle || null,
    tags: list(p.tags),
    mcVersions: list(p.mcVersions),
    version: p.version,
    featured: p.featured,
    published: p.published,
    sortOrder: p.sortOrder,
    bannerUrl: p.bannerUrl,
    highlights: p.highlights,
    content: p.content,
    updatedAt: new Date(),
  };

  let id = p.id;
  if (id) {
    await db.update(products).set(values).where(eq(products.id, id));
  } else {
    const [row] = await db.insert(products).values(values).returning({ id: products.id });
    id = row.id;
  }

  // Turning licensing on for a product that already has owners gives them their keys
  if (values.requiresLicense) await backfillLicenses({ id: id!, slug: p.slug, requiresLicense: true });

  updateTag("products");
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, id };
}

export async function deleteProductAction(id: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: e.invalidId };

  try {
    await db.delete(products).where(eq(products.id, parsed.data));
  } catch {
    // order_item references products with ON DELETE RESTRICT
    return { ok: false, error: e.productHasOrders };
  }
  updateTag("products");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveDocAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = docSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { id, ...doc } = parsed.data;

  const clash = await db.query.docPages.findFirst({
    where: id ? and(eq(docPages.slug, doc.slug), ne(docPages.id, id)) : eq(docPages.slug, doc.slug),
    columns: { id: true },
  });
  if (clash) return { ok: false, error: e.docSlugTaken };

  const values = { ...doc, productId: doc.productId ?? null, updatedAt: new Date() };
  let savedId = id;
  if (id) {
    await db.update(docPages).set(values).where(eq(docPages.id, id));
  } else {
    const [row] = await db.insert(docPages).values(values).returning({ id: docPages.id });
    savedId = row.id;
  }
  updateTag("docs");
  revalidatePath("/admin", "layout");
  return { ok: true, id: savedId };
}

export async function deleteDocAction(id: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: e.invalidId };
  await db.delete(docPages).where(eq(docPages.id, parsed.data));
  updateTag("docs");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveFaqAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { id, ...faq } = parsed.data;

  if (id) await db.update(faqs).set(faq).where(eq(faqs.id, id));
  else await db.insert(faqs).values(faq);
  updateTag("faqs");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteFaqAction(id: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: e.invalidId };
  await db.delete(faqs).where(eq(faqs.id, parsed.data));
  updateTag("faqs");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function savePartnerAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = partnerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { id, ...partner } = parsed.data;

  if (id) await db.update(partners).set(partner).where(eq(partners.id, id));
  else await db.insert(partners).values(partner);
  updateTag("partners");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deletePartnerAction(id: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: e.invalidId };
  await db.delete(partners).where(eq(partners.id, parsed.data));
  updateTag("partners");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveSettingsAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);

  await db
    .insert(settings)
    .values({ key: "site", value: parsed.data })
    .onConflictDoUpdate({ target: settings.key, set: { value: parsed.data } });
  updateTag("settings");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveSeoAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = seoSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);

  // Stored in the same settings table as the site settings, under its own key
  const value = { ...parsed.data, siteUrl: parsed.data.siteUrl.replace(/\/$/, "") } as unknown as SiteSettings;
  await db.insert(settings).values({ key: "seo", value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  updateTag("seo");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setUserRoleAction(input: unknown): Promise<AdminResult> {
  const me = await assertAdmin();
  const parsed = z.object({ userId: z.uuid(), role: z.string().min(1).max(40) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: e.invalidData };
  if (parsed.data.userId === me.id) return { ok: false, error: e.ownRole };
  const role = await db.query.roles.findFirst({ where: eq(roles.key, parsed.data.role), columns: { key: true } });
  if (!role) return { ok: false, error: e.unknownRole };

  await db.update(users).set({ role: role.key }).where(eq(users.id, parsed.data.userId));
  // Discord rules can depend on the site role
  after(() => syncDiscordMember(parsed.data.userId));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const roleSchema = z.object({
  key: z.string().max(40).optional(),
  name: z.string().trim().min(2).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, admin.validation.hexColor),
  // Euros; null = manual role (never given automatically)
  minSpend: z.coerce.number().min(0).max(1_000_000).nullable().default(null),
});

/** Creates a role (key derived from the name) or edits an existing one's name, color and spend threshold. */
export async function saveRoleAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { key, name, color, minSpend } = parsed.data;
  const minSpendCents = minSpend == null ? null : toCents(minSpend);

  let thresholdChanged = minSpendCents != null;
  if (key) {
    const existing = await db.query.roles.findFirst({ where: eq(roles.key, key) });
    if (!existing) return { ok: false, error: e.unknownRole };
    // Built-in roles are never auto-assigned
    if (existing.system && minSpendCents != null) return { ok: false, error: e.systemThreshold };
    thresholdChanged = existing.minSpendCents !== minSpendCents;
    await db.update(roles).set({ name, color, minSpendCents }).where(eq(roles.key, key));
  } else {
    const newKey = slugify(name);
    if (!newKey) return { ok: false, error: e.invalidData };
    const exists = await db.query.roles.findFirst({ where: eq(roles.key, newKey), columns: { key: true } });
    if (exists) return { ok: false, error: e.roleExists };
    // New roles sit between the built-in "user" (0) and "admin" (100)
    await db.insert(roles).values({ key: newKey, name, color, minSpendCents, sortOrder: 50 });
  }
  if (thresholdChanged) await syncAllUserRoles();
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export type RecalcResult = { ok: true; changed: number } | { ok: false; error: string };

/** Re-applies spend thresholds to every user. */
export async function recalcRolesAction(): Promise<RecalcResult> {
  await assertAdmin();
  const changed = await syncAllUserRoles();
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, changed };
}

/** Gives a user a product for free (an admin-created €0 order), like a purchase without payment. */
export async function grantProductAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = z.object({ userId: z.uuid(), productId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: e.invalidData };
  const { userId, productId } = parsed.data;

  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) return { ok: false, error: e.invalidId };
  if ((await getOwnedProductIds(userId)).has(productId)) return { ok: false, error: e.alreadyOwned };

  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({ userId, subtotalCents: 0, totalCents: 0, couponCode: GRANT_CODE })
      .returning({ id: orders.id });
    await tx.insert(orderItems).values({ orderId: order.id, productId, priceCents: 0 });
    await issueLicenses(tx, userId, [product]);
  });

  await syncUserRole(userId);
  after(() => syncDiscordMember(userId));
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Takes a product back: removes it from the user's orders (and its license). */
export async function revokeProductAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = z.object({ userId: z.uuid(), productId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: e.invalidData };
  const { userId, productId } = parsed.data;

  await db.transaction(async (tx) => {
    const userOrders = tx.select({ id: orders.id }).from(orders).where(eq(orders.userId, userId));
    await tx.delete(orderItems).where(and(eq(orderItems.productId, productId), inArray(orderItems.orderId, userOrders)));
    await deleteLicenses(tx, userId, [productId]);
    // Drop orders left without items (e.g. an admin grant)
    await tx.execute(
      sql`delete from ${orders} o where o.user_id = ${userId} and not exists (select 1 from ${orderItems} oi where oi.order_id = o.id)`,
    );
  });

  await syncUserRole(userId);
  after(() => syncDiscordMember(userId));
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// Marks orders created by an admin grant, so they read differently in the orders list
const GRANT_CODE = "ADMIN-GRANT";


const licenseStatusSchema = z.object({ id: z.uuid(), status: z.enum(["active", "revoked"]) });

/** Revoke a license (the key stops verifying) or turn it back on. */
export async function setLicenseStatusAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = licenseStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: e.invalidData };
  await db.update(licenses).set({ status: parsed.data.status }).where(eq(licenses.id, parsed.data.id));
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** New key for any license; the old one stops working at once. */
export async function regenerateLicenseAction(id: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: e.invalidId };
  if (!(await regenerateLicenseKey(parsed.data))) return { ok: false, error: e.invalidId };
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Deletes a custom role; its members fall back to "user" (ON DELETE SET DEFAULT). */
export async function deleteRoleAction(key: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = z.string().min(1).max(40).safeParse(key);
  if (!parsed.success) return { ok: false, error: e.invalidId };

  const role = await db.query.roles.findFirst({ where: eq(roles.key, parsed.data) });
  if (!role) return { ok: false, error: e.unknownRole };
  if (role.system) return { ok: false, error: e.systemRole };

  await db.delete(roles).where(eq(roles.key, role.key));
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function setMessageHandledAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = z.object({ id: z.uuid(), handled: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: e.invalidData };

  await db.update(contactMessages).set({ handled: parsed.data.handled }).where(eq(contactMessages.id, parsed.data.id));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveCouponAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const c = parsed.data;

  let userId: string | null = null;
  if (c.userEmail) {
    const owner = await db.query.users.findFirst({ where: eq(users.email, c.userEmail), columns: { id: true } });
    if (!owner) return { ok: false, error: e.noAccount(c.userEmail) };
    userId = owner.id;
  }

  const clash = await db.query.coupons.findFirst({
    where: c.id ? and(eq(coupons.code, c.code), ne(coupons.id, c.id)) : eq(coupons.code, c.code),
    columns: { id: true },
  });
  if (clash) return { ok: false, error: e.couponTaken };

  const values = {
    code: c.code,
    description: c.description,
    type: c.type,
    amount: c.type === "fixed" ? toCents(c.amount) : Math.round(c.amount),
    minSubtotalCents: toCents(c.minSubtotal),
    maxUses: c.maxUses,
    perUserLimit: c.perUserLimit,
    userId,
    productIds: c.productIds,
    creatorName: c.creatorName || null,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    active: c.active,
  };

  let id = c.id;
  if (id) await db.update(coupons).set(values).where(eq(coupons.id, id));
  else id = (await db.insert(coupons).values(values).returning({ id: coupons.id }))[0].id;

  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, id };
}

export async function deleteCouponAction(id: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: e.invalidId };
  await db.delete(coupons).where(eq(coupons.id, parsed.data));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveCampaignAction(input: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { id, ...campaign } = parsed.data;

  let savedId = id;
  if (id) await db.update(campaigns).set(campaign).where(eq(campaigns.id, id));
  else savedId = (await db.insert(campaigns).values(campaign).returning({ id: campaigns.id }))[0].id;

  updateTag("campaigns");
  revalidatePath("/admin", "layout");
  return { ok: true, id: savedId };
}

export async function deleteCampaignAction(id: unknown): Promise<AdminResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: e.invalidId };
  await db.delete(campaigns).where(eq(campaigns.id, parsed.data));
  updateTag("campaigns");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
