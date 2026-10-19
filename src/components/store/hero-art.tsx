"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/db/schema";
import { ProductArt } from "./product-art";

const POSITIONS = [
  { className: "left-[6%] top-[8%] w-[46%] rotate-[-8deg] z-10", delay: 0 },
  { className: "right-[4%] top-[2%] w-[42%] rotate-[7deg] z-0", delay: 0.4 },
  { className: "left-[28%] bottom-[0%] w-[48%] rotate-[2deg] z-20", delay: 0.8 },
];

/** Floating stack of the featured plugin covers on the hero's right side. */
export function HeroArt({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-[520px] lg:block">
      <div aria-hidden className="absolute inset-[12%] rounded-full bg-brand/40 blur-[90px]" />
      {products.map((p, i) => {
        const pos = POSITIONS[i];
        return (
          <motion.div
            key={p.id}
            className={`absolute ${pos.className}`}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: [0, -12, 0], scale: 1 }}
            transition={{
              opacity: { duration: 0.6, delay: pos.delay * 0.5 },
              scale: { duration: 0.6, delay: pos.delay * 0.5 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: pos.delay },
            }}
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
          >
            <Link href={`/products/${p.slug}`}>
              <ProductArt product={p} size="md" sizes="260px" priority className="aspect-square w-full rounded-md shadow-2xl shadow-black/60 ring-1 ring-white/15" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
