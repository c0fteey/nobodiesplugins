import "server-only";
import { randomInt } from "node:crypto";
import { and, eq, inArray, notExists, sql } from "drizzle-orm";
import { db } from "@/db";
import { licenses, orderItems, orders, products, type Product } from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type LicensedProduct = Pick<Product, "id" | "slug" | "requiresLicense">;

// No 0/O/1/I so keys can be read out and typed without mistakes
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const chunk = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

/** "nobodies-crates" -> "CRATES": the product part of a key, so keys can't be mixed up between plugins. */
function keyPrefix(slug: string) {
  const name = slug.replace(/^nobodies-/, "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  return name.slice(0, 8) || "NB";
}

/** e.g. NB-CRATES-7KQ2-M9XA-4HTP */
export function generateLicenseKey(slug: string) {
  return `NB-${keyPrefix(slug)}-${chunk()}-${chunk()}-${chunk()}`;
}

/** Gives the user a license for every product in the list that needs one (no-op for ones they already have). */
export async function issueLicenses(tx: Tx | typeof db, userId: string, items: LicensedProduct[]) {
  const licensed = items.filter((p) => p.requiresLicense);
  if (!licensed.length) return;
  await tx
    .insert(licenses)
    .values(licensed.map((p) => ({ userId, productId: p.id, key: generateLicenseKey(p.slug) })))
    .onConflictDoNothing();
}

/** After a product starts requiring a license: issue one to everyone who already owns it. */
export async function backfillLicenses(product: LicensedProduct) {
  if (!product.requiresLicense) return 0;
  const owners = await db
    .selectDistinct({ userId: orders.userId })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orderItems.productId, product.id),
        notExists(
          db
            .select({ one: sql`1` })
            .from(licenses)
            .where(and(eq(licenses.userId, orders.userId), eq(licenses.productId, product.id))),
        ),
      ),
    );
  for (const { userId } of owners) await issueLicenses(db, userId, [product]);
  return owners.length;
}

/** New key for a license (e.g. it leaked); the old key stops working immediately. */
export async function regenerateLicenseKey(licenseId: string, userId?: string) {
  const row = await db
    .select({ id: licenses.id, slug: products.slug })
    .from(licenses)
    .innerJoin(products, eq(products.id, licenses.productId))
    .where(userId ? and(eq(licenses.id, licenseId), eq(licenses.userId, userId)) : eq(licenses.id, licenseId))
    .then((r) => r[0]);
  if (!row) return null;
  const key = generateLicenseKey(row.slug);
  await db.update(licenses).set({ key, activations: 0, lastSeenAt: null, lastServer: null, lastIp: null }).where(eq(licenses.id, row.id));
  return key;
}

export type VerifyResult =
  | { valid: true; product: { slug: string; name: string; version: string } }
  | { valid: false; reason: "not_found" | "revoked" | "wrong_product" };

/**
 * What a plugin calls on startup. `product` is the product slug (or id); `server`
 * is any label the plugin sends (server name / IP:port). Successful checks are
 * counted and the last server is remembered, which powers the dashboard stats.
 */
export async function verifyLicense(input: { key: string; product: string; server?: string | null; ip?: string | null }): Promise<VerifyResult> {
  const row = await db
    .select({ license: licenses, product: products })
    .from(licenses)
    .innerJoin(products, eq(products.id, licenses.productId))
    .where(eq(licenses.key, input.key.trim().toUpperCase()))
    .then((r) => r[0]);

  if (!row) return { valid: false, reason: "not_found" };
  if (row.product.slug !== input.product && row.product.id !== input.product) return { valid: false, reason: "wrong_product" };
  if (row.license.status !== "active") return { valid: false, reason: "revoked" };

  await db
    .update(licenses)
    .set({
      activations: sql`${licenses.activations} + 1`,
      lastSeenAt: new Date(),
      lastServer: input.server?.slice(0, 120) || null,
      lastIp: input.ip?.slice(0, 64) || null,
    })
    .where(eq(licenses.id, row.license.id));

  return {
    valid: true,
    product: { slug: row.product.slug, name: row.product.name, version: row.product.version },
  };
}

/** Licenses of these products, for removing them when a product is taken back. */
export async function deleteLicenses(tx: Tx, userId: string, productIds: string[]) {
  if (!productIds.length) return;
  await tx.delete(licenses).where(and(eq(licenses.userId, userId), inArray(licenses.productId, productIds)));
}
