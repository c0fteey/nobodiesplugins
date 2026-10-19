"use client";

import { motion } from "framer-motion";
import { CheckIcon, GiftIcon, ShoppingCartIcon, ZapIcon } from "lucide-react";
import type { Product } from "@/db/schema";
import type { Highlight } from "@/lib/content-blocks";
import { useNow } from "@/hooks/use-now";
import { formatPrice } from "@/lib/format";
import { ProductArt } from "../product-art";
import { useCart } from "../cart-provider";

export function BuyBox({ product, highlights }: { product: Product; highlights: Highlight[] }) {
  const { add, has, campaigns, catalog } = useCart();
  const now = useNow();
  const inCart = has(product.id);
  const savePct =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round(((product.compareAtCents - product.priceCents) / product.compareAtCents) * 100)
      : 0;

  // Gifts from live "buy X get Y" campaigns
  const gifts =
    now === null
      ? []
      : campaigns
          .filter(
            (c) =>
              c.triggerProductId === product.id &&
              (!c.startsAt || new Date(c.startsAt).getTime() <= now) &&
              (!c.endsAt || new Date(c.endsAt).getTime() > now),
          )
          .map((c) => catalog.find((p) => p.id === c.rewardProductId))
          .filter((p): p is Product => !!p);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#19181f] p-6">
        <div className="flex items-end gap-3">
          <p className="text-4xl font-extrabold tracking-tight">
            {product.priceCents ? formatPrice(product.priceCents) : "Free"}
          </p>
          {product.compareAtCents && (
            <p className="mb-1 text-sm text-white/50 line-through">{formatPrice(product.compareAtCents)}</p>
          )}
          {savePct > 0 && (
            <span className="mb-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">-{savePct}%</span>
          )}
        </div>
        <p className="mt-2 text-xs text-white/50">One-time purchase · lifetime updates · license included</p>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => add(product.id)}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand/85"
        >
          <ZapIcon className="size-4" /> Buy now
        </motion.button>
        <button
          type="button"
          onClick={() => add(product.id, { open: false })}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-semibold transition hover:bg-white/5"
        >
          {inCart ? <CheckIcon className="size-4 text-success" /> : <ShoppingCartIcon className="size-4" />}
          {inCart ? "In your cart" : "Add to cart"}
        </button>
      </div>

      {(highlights.length > 0 || product.mcVersions.length > 0) && (
        <div className="rounded-2xl border border-white/10 bg-[#19181f] p-6">
          <p className="text-sm font-bold">Key Stats</p>
          <dl className="mt-4 space-y-3 text-sm">
            {product.mcVersions.length > 0 && (
              <Stat label="Minecraft" value={`${product.mcVersions[0]} – ${product.mcVersions.at(-1)}`} />
            )}
            <Stat label="Version" value={`v${product.version}`} />
            {highlights.map((h, i) => (
              <Stat key={i} label={h.label} value={h.value} />
            ))}
          </dl>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#19181f] p-6">
        <p className="text-sm font-bold">Products included</p>
        <ul className="mt-4 space-y-3">
          {[product, ...gifts].map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <ProductArt product={p} size="sm" sizes="40px" className="size-10 shrink-0 rounded-md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.name}</span>
                <span className="text-xs text-white/50">
                  {i === 0 ? formatPrice(p.priceCents) : <span className="inline-flex items-center gap-1 text-success"><GiftIcon className="size-3" /> Free gift · worth {formatPrice(p.priceCents)}</span>}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <dt className="flex items-center gap-2 text-white/60">
        <span className="size-1.5 rounded-full bg-brand-soft" /> {label}
      </dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
