"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLinkIcon, GiftIcon, Loader2Icon, TicketPercentIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { checkoutAction, previewCartAction, type CartPreview } from "@/actions/store";
import { formatPrice, formatPriceCompact } from "@/lib/format";
import { ProductArt } from "./product-art";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const { items, catalog, isOpen, close, remove, add, clear, couponCode, setCouponCode } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [couponDraft, setCouponDraft] = useState("");
  const [preview, setPreview] = useState<Extract<CartPreview, { ok: true }> | null>(null);
  const productIds = items.map((p) => p.id).join(",");

  // Server-side pricing: coupon discount, free campaign gifts, final total
  useEffect(() => {
    if (!isOpen || !productIds) return;
    let cancelled = false;
    previewCartAction({ productIds: productIds.split(","), couponCode: couponCode || null }).then((result) => {
      if (!cancelled && result.ok) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, productIds, couponCode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const localSubtotal = items.reduce((sum, p) => sum + p.priceCents, 0);
  const localSavings = items.reduce((sum, p) => sum + Math.max(0, (p.compareAtCents ?? p.priceCents) - p.priceCents), 0);
  const fresh = preview && productIds ? preview : null;
  const savings = fresh ? fresh.saleSavingsCents : localSavings;
  const total = fresh ? fresh.totalCents : localSubtotal;
  const gifts = fresh ? fresh.gifts : [];
  const giftIds = new Set(gifts.map((g) => g.productId));

  // "For you": add-ons of plugins in the cart first, then other add-ons
  const inCart = new Set(items.map((p) => p.id));
  const parentIds = new Set(items.map((p) => (p.type === "addon" ? p.parentId : p.id)));
  const suggestions = catalog
    .filter((p) => p.type === "addon" && !inCart.has(p.id) && !giftIds.has(p.id))
    .sort((a, b) => Number(parentIds.has(b.parentId)) - Number(parentIds.has(a.parentId)))
    .slice(0, 8);

  function checkout() {
    startTransition(async () => {
      const result = await checkoutAction({ productIds: items.map((p) => p.id), couponCode: couponCode || null });
      if (!result.ok) {
        toast.error(result.error);
        if (result.unauthenticated) {
          close();
          router.push("/login?callbackUrl=/products");
        }
        return;
      }
      clear();
      close();
      const count = result.purchased + result.gifted;
      toast.success(`Purchase complete — ${count} item${count > 1 ? "s" : ""} added to your library${result.gifted ? " (incl. free gifts)" : ""}`);
      router.push("/dashboard/purchases");
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="My cart">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-[#1c1c1e] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
          >
            <header className="flex items-center justify-between border-b border-white/5 bg-[#202022] px-6 py-6 sm:px-10">
              <h2 className="text-2xl font-semibold">
                My Cart{" "}
                <span className="text-sm font-medium">
                  ({items.length} {items.length === 1 ? "item" : "items"})
                </span>
              </h2>
              <button type="button" onClick={close} aria-label="Close cart" className="rounded-md p-1 transition hover:bg-white/10">
                <XIcon className="size-7" strokeWidth={1.5} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <Image src="/images/spider.png" alt="" width={300} height={225} className="h-auto w-[300px] [image-rendering:pixelated]" />
                </motion.div>
                <p className="mt-6 max-w-xs text-xl leading-tight font-bold">Oops... looks like the spiders padded through here</p>
                <p className="mt-3 max-w-xs text-sm">Add products to your cart and remove them from here</p>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    router.push("/products");
                  }}
                  className="mt-6 inline-flex items-center gap-3 text-base font-medium transition hover:text-brand-soft"
                >
                  Lets buy <ExternalLinkIcon className="size-5 text-brand-soft" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
                  <ul className="space-y-5">
                    <AnimatePresence initial={false}>
                      {items.map((p) => (
                        <motion.li
                          key={p.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          className="flex items-center gap-6"
                        >
                          <ProductArt product={p} size="sm" sizes="96px" className="size-24 shrink-0 rounded-md" />
                          <div className="flex-1">
                            <p className="text-lg font-semibold">{p.name}</p>
                            <button
                              type="button"
                              onClick={() => remove(p.id)}
                              className="mt-1 inline-flex items-center gap-1.5 text-sm text-sale transition hover:opacity-80"
                            >
                              <Trash2Icon className="size-4" /> Remove
                            </button>
                          </div>
                          <div className="text-right text-lg font-semibold">
                            {giftIds.has(p.id) ? (
                              <span className="text-success">FREE</span>
                            ) : p.compareAtCents && (
                              <span className="mr-2 text-base font-normal text-sale line-through">
                                {formatPrice(p.compareAtCents)}
                              </span>
                            )}
                            {!giftIds.has(p.id) && formatPrice(p.priceCents)}
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>

                  {/* Free campaign gifts that aren't already in the cart */}
                  <AnimatePresence>
                    {gifts
                      .filter((g) => !items.some((p) => p.id === g.productId))
                      .map((g) => (
                        <motion.div
                          key={g.productId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-5 flex items-center gap-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3"
                        >
                          <GiftIcon className="size-6 shrink-0 text-success" />
                          <div className="flex-1">
                            <p className="font-semibold">{g.name}</p>
                            <p className="text-xs text-white/70">{g.campaignLabel} · included free with your order</p>
                          </div>
                          <div className="text-right">
                            <span className="block text-xs text-white/50 line-through">{formatPrice(g.worthCents)}</span>
                            <span className="font-bold text-success">FREE</span>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>

                  {suggestions.length > 0 && (
                    <section className="mt-10">
                      <h3 className="text-xl font-medium">For you</h3>
                      <div className="scrollbar-none mt-4 -mr-6 flex gap-6 overflow-x-auto pr-6 pb-2 sm:-mr-10">
                        {suggestions.map((p) => (
                          <div key={p.id} className="w-[170px] shrink-0">
                            <div className="relative">
                              <ProductArt product={p} size="sm" sizes="170px" className="aspect-square w-full rounded-md" />
                              {p.badge === "sale" && <SaleRibbon />}
                            </div>
                            <div className="mt-3 flex justify-between gap-2 text-sm font-semibold">
                              <span className="line-clamp-2">{p.name}</span>
                              <span className="shrink-0 text-right">
                                {formatPrice(p.priceCents)}
                                {p.compareAtCents && (
                                  <span className="block text-[11px] font-normal text-sale line-through">
                                    {formatPrice(p.compareAtCents)}
                                  </span>
                                )}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => add(p.id)}
                              className="mt-4 h-12 w-full rounded-full bg-brand text-base font-medium text-white transition hover:bg-brand/85"
                            >
                              Quick Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <footer className="border-t-2 border-white/90 px-6 py-6 sm:px-10">
                  <div className="mb-5">
                    {couponCode ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
                        <span className="flex flex-wrap items-center gap-2">
                          <TicketPercentIcon className="size-4 text-brand-soft" />
                          <b>{couponCode}</b>
                          {fresh?.coupon && <span className="text-success">{fresh.coupon.label}</span>}
                          {fresh?.couponError && <span className="text-sale">{fresh.couponError}</span>}
                        </span>
                        <button type="button" onClick={() => setCouponCode("")} className="text-xs text-white/60 hover:text-white">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (couponDraft.trim()) setCouponCode(couponDraft);
                          setCouponDraft("");
                        }}
                        className="flex gap-2"
                      >
                        <input
                          value={couponDraft}
                          onChange={(e) => setCouponDraft(e.target.value)}
                          placeholder="Coupon or creator code"
                          aria-label="Coupon code"
                          className="h-11 flex-1 rounded-full border border-white/15 bg-transparent px-5 text-sm uppercase outline-none placeholder:normal-case placeholder:text-white/40 focus:border-brand"
                        />
                        <button type="submit" className="h-11 rounded-full bg-white/10 px-5 text-sm font-semibold transition hover:bg-white/15">
                          Apply
                        </button>
                      </form>
                    )}
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Season Savings</span>
                      <span className="text-success">{formatPriceCompact(savings)}</span>
                    </div>
                  )}
                  {fresh && fresh.couponDiscountCents > 0 && (
                    <div className="mt-3 flex justify-between text-lg font-semibold">
                      <span>Coupon ({fresh.coupon?.code})</span>
                      <span className="text-success">−{formatPriceCompact(fresh.couponDiscountCents)}</span>
                    </div>
                  )}
                  <div className="mt-4 flex justify-between text-lg font-semibold">
                    <span>Sub Total</span>
                    <span>{formatPriceCompact(total)}</span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={close}
                      className="h-14 rounded-full border border-brand text-lg font-medium text-brand-soft transition hover:bg-brand/10"
                    >
                      Resume shopping
                    </button>
                    <button
                      type="button"
                      onClick={checkout}
                      disabled={pending}
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand text-lg font-medium text-white transition hover:bg-brand/85 disabled:opacity-60"
                    >
                      {pending && <Loader2Icon className="size-5 animate-spin" />}
                      Quick Checkout
                    </button>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SaleRibbon({ label = "Sale" }: { label?: string }) {
  return (
    <span className="absolute top-0 left-2 flex h-16 w-6 items-center justify-center rounded-b-sm bg-sale text-[11px] font-semibold text-white shadow">
      <span className="-rotate-90 whitespace-nowrap">{label}</span>
    </span>
  );
}
