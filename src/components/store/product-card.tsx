"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductArt } from "./product-art";
import { SaleRibbon } from "./cart-drawer";
import { useCart } from "./cart-provider";

export function AddToCartButton({ productId, className }: { productId: string; className?: string }) {
  const { add, has } = useCart();
  const inCart = has(productId);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={() => add(productId)}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white transition",
        inCart ? "bg-brand/30 text-brand-soft" : "bg-brand hover:bg-brand/85",
        className,
      )}
    >
      {inCart && <CheckIcon className="size-4" />}
      {inCart ? "In cart" : "Add to cart"}
    </motion.button>
  );
}

export function PriceTag({ product, size = "md" }: { product: Product; size?: "md" | "lg" }) {
  return (
    <div>
      {product.compareAtCents ? (
        <p className="text-[11px] text-white/60 line-through">{formatPrice(product.compareAtCents)}</p>
      ) : (
        <p className="text-[11px] opacity-0">-</p>
      )}
      <p className={cn("font-semibold tracking-tight", size === "lg" ? "text-3xl" : "text-[22px]")}>
        {product.priceCents === 0 ? "Free" : formatPrice(product.priceCents)}
      </p>
    </div>
  );
}

/** Grid card used on home sections, /products and /addons. */
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="group flex flex-col"
    >
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden rounded-xl">
        <motion.div whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
          <ProductArt product={product} priority={priority} className="aspect-[4/3] w-full" />
        </motion.div>
        {product.badge && <SaleRibbon label={product.badge === "sale" ? "Sale" : "New"} />}
      </Link>
      <h3 className="mt-5 text-base font-bold">
        <Link href={`/products/${product.slug}`} className="transition hover:text-brand-soft">
          {product.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-white/80">{product.shortDescription}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <PriceTag product={product} />
        <AddToCartButton productId={product.id} />
      </div>
    </motion.article>
  );
}

/** Large "Our Specialization" card with the description over the art. */
export function FeatureCard({ product }: { product: Product }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="group relative aspect-[3/4] w-[80vw] max-w-[420px] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[46%]"
    >
      <Link href={`/products/${product.slug}`} className="absolute inset-0">
        <ProductArt product={product} size="lg" sizes="420px" className="absolute inset-0 transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        {product.badge && <SaleRibbon label={product.badge === "sale" ? "Sale" : "New"} />}
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h3 className="text-xl font-bold">{product.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-white/85">{product.shortDescription}</p>
          <div className="mt-3 flex items-end justify-between">
            <PriceTag product={product} size="lg" />
            <span className="mb-1 text-2xl transition group-hover:translate-x-1">→</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
