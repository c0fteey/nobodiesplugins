"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/db/schema";
import { ProductBrowser, type BrowserCategory } from "./product-browser";

// Category matchers are functions, so they're built here on the client
// instead of being passed across the server/client boundary.

const shortName = (name: string) => name.replace(/^NOBODIES\s+/i, "");

export function ProductsCatalog({ products }: { products: Product[] }) {
  const categories = useMemo<BrowserCategory[]>(() => {
    const plugins = products.filter((p) => p.type === "plugin");
    return [
      ...plugins.map((plugin) => ({
        value: plugin.slug,
        label: shortName(plugin.name),
        match: (p: Product) => p.id === plugin.id || p.parentId === plugin.id,
      })),
      { value: "model", label: "Models", match: (p: Product) => p.type === "model" },
      { value: "build", label: "Builds", match: (p: Product) => p.type === "build" },
    ];
  }, [products]);

  // Remount when ?category= changes so links like "Browse by plugin" apply
  const key = useSearchParams().get("category") ?? "all";
  return <ProductBrowser key={key} products={products} categories={categories} />;
}

export function AddonsCatalog({ addons, plugins }: { addons: Product[]; plugins: Product[] }) {
  const categories = useMemo<BrowserCategory[]>(
    () =>
      plugins
        .filter((plugin) => addons.some((a) => a.parentId === plugin.id))
        .map((plugin) => ({
          value: plugin.slug,
          label: shortName(plugin.name),
          match: (p: Product) => p.parentId === plugin.id,
        })),
    [addons, plugins],
  );

  const key = useSearchParams().get("category") ?? "all";
  return <ProductBrowser key={key} products={addons} categories={categories} allLabel="All add-ons" />;
}
