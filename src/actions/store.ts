"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, couponRedemptions, licenses, orderItems, orders, products } from "@/db/schema";
import { getActionUser } from "@/lib/auth-guard";
import { getOwnedProductIds } from "@/lib/data/account";
import { syncDiscordMember } from "@/lib/discord";
import { syncUserRole } from "@/lib/role-sync";
import { consumeCoupon, priceCart } from "@/lib/promotions";
import { checkoutSchema, contactSchema } from "@/lib/validations/store";
import { site } from "@/lang/site";

const t = site.checkout;

export type CheckoutResult =
  | { ok: true; orderId: string; purchased: number; gifted: number }
  | { ok: false; error: string; unauthenticated?: boolean };

export type CartPreview =
  | {
      ok: true;
      saleSavingsCents: number;
      couponDiscountCents: number;
      totalCents: number;
      coupon: { code: string; label: string } | null;
      couponError: string | null;
      gifts: { productId: string; name: string; campaignLabel: string; worthCents: number }[];
    }
  | { ok: false; error: string };

function licenseKey() {
  const chunk = () => randomBytes(3).toString("hex").toUpperCase();
  return `${chunk()}-${chunk()}-${chunk()}-${chunk()}`;
}

/** Server-priced totals for the cart drawer (coupon + free gifts). */
export async function previewCartAction(input: unknown): Promise<CartPreview> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? t.invalidCart };

  const user = await getActionUser();
  const owned = user ? await getOwnedProductIds(user.id) : undefined;
  const cart = await priceCart(parsed.data.productIds, {
    userId: user?.id ?? null,
    ownedIds: owned,
    couponCode: parsed.data.couponCode,
  });

  return {
    ok: true,
    saleSavingsCents: cart.saleSavingsCents,
    couponDiscountCents: cart.couponDiscountCents,
    totalCents: cart.totalCents,
    coupon: cart.coupon && { code: cart.coupon.code, label: cart.coupon.label },
    couponError: cart.couponError,
    gifts: cart.gifts.map((g) => ({
      productId: g.product.id,
      name: g.product.name,
      campaignLabel: g.campaign.label,
      worthCents: g.product.priceCents,
    })),
  };
}

/**
 * Creates a completed order for the cart. Prices, coupons and gifts are all
 * resolved on the server. NOTE: no payment provider is wired yet, so this is a
 * demo checkout; plug Stripe/Tebex in before taking real money.
 */
export async function checkoutAction(input: unknown): Promise<CheckoutResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: t.loginToCheckout, unauthenticated: true };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? t.invalidCart };

  const owned = await getOwnedProductIds(user.id);
  const cart = await priceCart(parsed.data.productIds, {
    userId: user.id,
    ownedIds: owned,
    couponCode: parsed.data.couponCode,
  });
  if (cart.couponError) return { ok: false, error: cart.couponError };
  if (cart.items.length === 0 && cart.gifts.length === 0) {
    return { ok: false, error: t.alreadyOwned };
  }

  let orderId: string;
  try {
    orderId = await db.transaction(async (tx) => {
      if (cart.coupon && !(await consumeCoupon(tx, cart.coupon.id))) {
        throw new Error("COUPON_USED_UP");
      }

      const [order] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          subtotalCents: cart.compareSubtotalCents,
          discountCents: cart.saleSavingsCents,
          couponCode: cart.coupon?.code ?? null,
          couponDiscountCents: cart.couponDiscountCents,
          totalCents: cart.totalCents,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values([
        ...cart.items.map((p) => ({ orderId: order.id, productId: p.id, priceCents: p.priceCents })),
        ...cart.gifts.map((g) => ({ orderId: order.id, productId: g.product.id, priceCents: 0, campaignId: g.campaign.id })),
      ]);

      if (cart.coupon) {
        await tx.insert(couponRedemptions).values({
          couponId: cart.coupon.id,
          userId: user.id,
          orderId: order.id,
          discountCents: cart.couponDiscountCents,
        });
      }

      // Plugins ship with a license key; add-ons/models/builds ride on the plugin's
      const licensed = [...cart.items, ...cart.gifts.map((g) => g.product)].filter((p) => p.type === "plugin");
      if (licensed.length) {
        await tx
          .insert(licenses)
          .values(licensed.map((p) => ({ userId: user.id, productId: p.id, key: licenseKey() })))
          .onConflictDoNothing();
      }
      return order.id;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "COUPON_USED_UP") {
      return { ok: false, error: site.coupons.justUsedUp };
    }
    throw error;
  }

  // Spend thresholds may promote the buyer (e.g. Müşteri -> Premium Müşteri)
  await syncUserRole(user.id);
  revalidatePath("/dashboard", "layout");
  // Hand out Discord roles for the new products once the response is sent
  after(() => syncDiscordMember(user.id));
  return { ok: true, orderId, purchased: cart.items.length, gifted: cart.gifts.length };
}

/** Free add-ons are "claimed" instead of bought. */
export async function claimFreeAction(productId: unknown): Promise<CheckoutResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: t.loginFirst, unauthenticated: true };

  const parsed = checkoutSchema.safeParse({ productIds: [productId] });
  if (!parsed.success) return { ok: false, error: t.invalidProduct };

  const product = await db.query.products.findFirst({ where: eq(products.id, parsed.data.productIds[0]) });
  if (!product || !product.published || product.priceCents !== 0) {
    return { ok: false, error: t.cannotClaim };
  }
  return checkoutAction({ productIds: [product.id] });
}

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendContactAction(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? site.common.invalidData };

  await db.insert(contactMessages).values(parsed.data);
  return { ok: true };
}
