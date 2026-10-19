import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/store/product-grid-skeleton";
import { getProducts } from "@/lib/data/store";
import { AddonsCatalog } from "@/components/store/catalogs";
import { DiscordCta } from "@/components/store/discord-cta";

export const metadata: Metadata = { title: "Add-ons" };

export default async function AddonsPage() {
  const products = await getProducts();
  const plugins = products.filter((p) => p.type === "plugin");
  const addons = products.filter((p) => p.type === "addon");
  const withAddons = plugins
    .map((plugin) => ({ plugin, count: addons.filter((a) => a.parentId === plugin.id).length }))
    .filter((x) => x.count > 0);

  return (
    <>
      <section className="container-page pt-12 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Add-ons for your plugins</h1>
        <p className="mx-auto mt-5 max-w-xl text-white/70">
          Everything that complements our plugins: animation packs, expansions, and more. Pick a plugin to see its
          add-ons.
        </p>
      </section>

      <section className="bg-[#181818] py-12">
        <div className="container-page">
          <p className="mb-5 text-sm font-semibold tracking-[0.12em] text-white/80">BROWSE BY PLUGIN</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {withAddons.map(({ plugin, count }) => (
              <Link
                key={plugin.id}
                href={`/addons?category=${plugin.slug}`}
                scroll={false}
                className="group relative flex h-[100px] items-center overflow-hidden rounded-sm px-6"
                style={{ background: `linear-gradient(110deg, ${plugin.accentFrom}, ${plugin.accentTo})` }}
              >
                <span aria-hidden className="absolute -right-4 -bottom-6 size-28 rotate-12 rounded-md bg-black/20 transition duration-500 group-hover:rotate-[24deg] group-hover:scale-110" />
                <span className="relative">
                  <span className="block text-2xl font-bold">{plugin.name.replace(/^NOBODIES\s+/i, "")}</span>
                  <span className="text-xs font-semibold text-white/80">
                    {count} ADD-ON{count > 1 ? "S" : ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={<ProductGridSkeleton />}>
        <AddonsCatalog addons={addons} plugins={plugins} />
      </Suspense>
      <DiscordCta />
    </>
  );
}
