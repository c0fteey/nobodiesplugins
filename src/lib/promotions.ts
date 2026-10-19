import "server-only";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, couponRedemptions, coupons, products, type Campaign, type Coupon, type Product } from "@/db/schema";
import { formatPriceCompact } from "@/lib/format";
import { site } from "@/lang/site";

const t = site.coupons;

export type CartGift = { product: Product; campaign: Campaign };

export type PricedCart = {
  items: Product[]; // paid items (gifts removed)
  gifts: CartGift[];
  compareSubtotalCents: number; // sum of "was" prices
  saleSavingsCents: number;
  couponDiscountCents: number;
  totalCents: number;
  coupon: { id: string; code: string; label: string } | null;
  couponError: string | null;
};

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export function isLive(window: { startsAt: Date | null; active: boolean } & ({ endsAt: Date | null } | { expiresAt: Date | null }), now = new Date()) {
  const end = "endsAt" in window ? window.endsAt : window.expiresAt;
  return window.active && (!window.startsAt || window.startsAt <= now) && (!end || end > now);
}

function couponLabel(c: Coupon) {
  const value = t.off(c.type === "percent" ? `%${c.amount}` : formatPriceCompact(c.amount));
  return c.creatorName ? `${value} · ${c.creatorName}` : value;
}

/** Validates a coupon against the cart. userId null = guest preview (account checks skipped where possible). */
async function evaluateCoupon(code: string, userId: string | null, items: Product[]) {
  const coupon = await db.query.coupons.findFirst({ where: eq(coupons.code, normalizeCode(code)) });
  if (!coupon || !isLive(coupon)) return { error: t.invalid } as const;
  if (coupon.maxUses != null && coupon.usesCount >= coupon.maxUses) return { error: t.usedUp } as const;

  if (coupon.userId) {
    if (!userId) return { error: t.loginRequired } as const;
    if (coupon.userId !== userId) return { error: t.otherAccount } as const;
  }
  if (userId) {
    const [{ used }] = await db
      .select({ used: count() })
      .from(couponRedemptions)
      .where(and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.userId, userId)));
    if (used >= coupon.perUserLimit) return { error: t.alreadyUsed } as const;
  }

  const total = items.reduce((s, p) => s + p.priceCents, 0);
  if (total < coupon.minSubtotalCents) {
    return { error: t.minSpend(formatPriceCompact(coupon.minSubtotalCents)) } as const;
  }

  const eligible = coupon.productIds.length ? items.filter((p) => coupon.productIds.includes(p.id)) : items;
  const eligibleSum = eligible.reduce((s, p) => s + p.priceCents, 0);
  if (eligibleSum === 0) return { error: t.notApplicable } as const;

  const discount =
    coupon.type === "percent" ? Math.round((eligibleSum * Math.min(coupon.amount, 100)) / 100) : Math.min(coupon.amount, eligibleSum);

  return { coupon, discount } as const;
}

/** Live campaigns whose trigger product is being bought. */
async function giftsFor(items: Product[], ownedIds: Set<string>) {
  if (items.length === 0) return [];
  const rows = await db
    .select({ campaign: campaigns, product: products })
    .from(campaigns)
    .innerJoin(products, eq(products.id, campaigns.rewardProductId))
    .where(
      and(
        inArray(campaigns.triggerProductId, items.map((p) => p.id)),
        eq(campaigns.active, true),
        eq(products.published, true),
      ),
    );

  const seen = new Set<string>();
  return rows
    .filter(({ campaign, product }) => {
      if (!isLive(campaign) || ownedIds.has(product.id) || seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    })
    .map(({ campaign, product }) => ({ campaign, product }));
}

/**
 * Single source of truth for cart pricing, used by the cart preview and by
 * checkout. Prices always come from the DB.
 */
export async function priceCart(
  productIds: string[],
  options: { userId: string | null; ownedIds?: Set<string>; couponCode?: string | null },
): Promise<PricedCart> {
  const owned = options.ownedIds ?? new Set<string>();
  const ids = [...new Set(productIds)].filter((id) => !owned.has(id));
  const rows = ids.length
    ? await db.select().from(products).where(and(inArray(products.id, ids), eq(products.published, true)))
    : [];

  const gifts = await giftsFor(rows, owned);
  // A gifted product isn't charged even if it was also added to the cart
  const giftIds = new Set(gifts.map((g) => g.product.id));
  const items = rows.filter((p) => !giftIds.has(p.id));

  const compareSubtotalCents = items.reduce((s, p) => s + (p.compareAtCents ?? p.priceCents), 0);
  const priceSum = items.reduce((s, p) => s + p.priceCents, 0);

  let coupon: PricedCart["coupon"] = null;
  let couponDiscountCents = 0;
  let couponError: string | null = null;
  if (options.couponCode?.trim()) {
    const result = await evaluateCoupon(options.couponCode, options.userId, items);
    if ("error" in result) couponError = result.error ?? null;
    else {
      coupon = { id: result.coupon.id, code: result.coupon.code, label: couponLabel(result.coupon) };
      couponDiscountCents = result.discount;
    }
  }

  return {
    items,
    gifts,
    compareSubtotalCents,
    saleSavingsCents: compareSubtotalCents - priceSum,
    couponDiscountCents,
    totalCents: Math.max(0, priceSum - couponDiscountCents),
    coupon,
    couponError,
  };
}

/** Atomically consumes one use of a coupon; false if it ran out in the meantime. */
export async function consumeCoupon(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], couponId: string) {
  const updated = await tx
    .update(coupons)
    .set({ usesCount: sql`${coupons.usesCount} + 1` })
    .where(and(eq(coupons.id, couponId), sql`(${coupons.maxUses} is null or ${coupons.usesCount} < ${coupons.maxUses})`))
    .returning({ id: coupons.id });
  return updated.length > 0;
}
