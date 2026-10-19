"use client";

import { motion } from "framer-motion";
import { TicketPercentIcon } from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/db/schema";
import { useCart } from "@/components/store/cart-provider";
import { formatDate, formatPrice } from "@/lib/format";

type AccountCoupon = Coupon & { usesLeft: number };

/** Coupons an admin locked to this account; one click puts them in the cart. */
export function AccountCoupons({ coupons }: { coupons: AccountCoupon[] }) {
  const { setCouponCode, open } = useCart();
  if (coupons.length === 0) return null;

  return (
    <section className="rounded-xl border border-white/5 bg-[#171717] p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <TicketPercentIcon className="size-5 text-brand-soft" /> Your coupons
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {coupons.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-dashed border-brand-soft/40 bg-brand/10 p-4"
          >
            <div className="text-center">
              <p className="text-2xl font-extrabold text-brand-soft">{c.type === "percent" ? `${c.amount}%` : formatPrice(c.amount)}</p>
              <p className="text-[10px] font-bold tracking-wider text-white/50">OFF</p>
            </div>
            <div className="min-w-0 flex-1 border-l border-dashed border-white/15 pl-4">
              <p className="font-mono font-bold">{c.code}</p>
              <p className="truncate text-xs text-white/60">{c.description || "Personal coupon"}</p>
              <p className="text-[11px] text-white/40">
                {c.expiresAt ? `Valid until ${formatDate(c.expiresAt)}` : "No expiry"} · {c.usesLeft} use{c.usesLeft > 1 ? "s" : ""} left
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCouponCode(c.code);
                toast.success(`${c.code} applied to your cart`);
                open();
              }}
              className="shrink-0 rounded-md bg-brand px-3 py-2 text-xs font-bold text-white transition hover:bg-brand/85"
            >
              Use
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
