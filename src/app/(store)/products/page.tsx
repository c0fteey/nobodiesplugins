import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/store/product-grid-skeleton";
import { getProducts } from "@/lib/data/store";
import { PluginCarousel } from "@/components/store/header-nav";
import { ProductsCatalog } from "@/components/store/catalogs";
import { DiscordCta } from "@/components/store/discord-cta";

export const metadata: Metadata = { title: "All products" };

export default async function ProductsPage() {
  const products = await getProducts();
  const plugins = products.filter((p) => p.type === "plugin");

  return (
    <>
      <section className="container-page pt-10 text-center">
        <h1 className="text-4xl leading-tight font-bold tracking-[-0.03em] sm:text-[56px]">
          Transform Your Minecraft
          <br className="hidden sm:block" /> Server Like Never Before
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-white/70">
          Discover plugins, models & builds that make running your server easier, more fun, and totally unique. Built
          for Minecraft servers who want their servers to stand out.
        </p>
        <PluginCarousel plugins={plugins} className="mt-12 text-left" />
      </section>

      {/* The browser reads ?category=, so it streams behind a boundary */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductsCatalog products={products} />
      </Suspense>
      <DiscordCta />
    </>
  );
}
