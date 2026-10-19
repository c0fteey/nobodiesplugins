"use client";

import { ShoppingCartIcon } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";

export function CartButton() {
  const { items, open } = useCart();
  return (
    <button type="button" onClick={open} aria-label="Open cart" className="relative text-white/80 transition hover:text-white">
      <ShoppingCartIcon className="size-6" strokeWidth={1.6} />
      {items.length > 0 && (
        <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
          {items.length}
        </span>
      )}
    </button>
  );
}
