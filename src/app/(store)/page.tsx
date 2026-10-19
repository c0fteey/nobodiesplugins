import Link from "next/link";
import { getProducts } from "@/lib/data/store";
import { FeatureCard, ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import { TrustedBar } from "@/components/store/trusted-bar";
import { HeroArt } from "@/components/store/hero-art";

export default async function HomePage() {
  const products = await getProducts();
  const plugins = products.filter((p) => p.type === "plugin");
  const addons = products.filter((p) => p.type === "addon");
  const models = products.filter((p) => p.type === "model");
  const builds = products.filter((p) => p.type === "build");

  return (
    <>
      <section className="container-page grid items-center gap-10 pt-14 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="text-center lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Premium Minecraft Plugins
          </div>
          <h1 className="text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-6xl lg:text-[64px]">
            <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">Transform</span>{" "}
            Your Minecraft Server Like Never Before
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/65 lg:mx-0">
            Premium plugins hand-crafted for serious Minecraft servers. Each one built to keep your players engaged
            and your server running at its best.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand/85 hover:shadow-brand/40 hover:shadow-xl"
          >
            Browse All <span aria-hidden className="text-lg leading-none">→</span>
          </Link>
        </div>
        <HeroArt products={plugins.slice(0, 3)} />
      </section>

      <TrustedBar />

      {plugins.length > 0 && (
        <section className="container-page pt-20">
          <SectionHeading title="Our Specialization" href="/products" />
          <div className="scrollbar-none -mx-4 flex snap-x gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {plugins.map((p) => (
              <FeatureCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <ProductSection
        title="Addons"
        description="Expansions & animation packs that level up your plugins."
        href="/addons"
        products={addons}
      />
      <ProductSection title="Models" description="Drop-in model packs for your server." href="/products?category=model" products={models} />
      <ProductSection title="Builds" description="Ready-made builds, spawns and arenas." href="/products?category=build" products={builds} />
      <div className="pb-20" />
    </>
  );
}

function ProductSection({
  title,
  description,
  href,
  products,
}: {
  title: string;
  description: string;
  href: string;
  products: Awaited<ReturnType<typeof getProducts>>;
}) {
  if (products.length === 0) return null;
  return (
    <section className="container-page pt-20">
      <SectionHeading title={title} description={description} href={href} />
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
