"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import type { Campaign, Product } from "@/db/schema";
import { CartDrawer } from "./cart-drawer";
import { cartStore, couponStore } from "./cart-store";

type CartContextValue = {
  items: Product[];
  catalog: Product[];
  campaigns: Campaign[];
  couponCode: string;
  setCouponCode: (code: string) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (id: string, options?: { open?: boolean }) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  catalog,
  campaigns,
  children,
}: {
  catalog: Product[];
  campaigns: Campaign[];
  children: React.ReactNode;
}) {
  // Server and first client render see an empty cart; localStorage kicks in after hydration
  const ids = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const couponCode = useSyncExternalStore(couponStore.subscribe, couponStore.getSnapshot, couponStore.getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  // Drop ids of products that were unpublished since they were added
  const items = useMemo(() => ids.map((id) => byId.get(id)).filter((p): p is Product => !!p), [ids, byId]);

  const add = useCallback((id: string, options?: { open?: boolean }) => {
    cartStore.update((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (options?.open ?? true) setIsOpen(true);
  }, []);
  const remove = useCallback((id: string) => cartStore.update((prev) => prev.filter((v) => v !== id)), []);
  const clear = useCallback(() => {
    cartStore.set([]);
    couponStore.set("");
  }, []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const setCouponCode = useCallback((code: string) => couponStore.set(code.trim().toUpperCase()), []);

  const value = useMemo(
    () => ({
      items,
      catalog,
      campaigns,
      couponCode,
      setCouponCode,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      remove,
      clear,
      has,
    }),
    [items, catalog, campaigns, couponCode, setCouponCode, isOpen, add, remove, clear, has],
  );

  return (
    <CartContext value={value}>
      {children}
      <CartDrawer />
    </CartContext>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
