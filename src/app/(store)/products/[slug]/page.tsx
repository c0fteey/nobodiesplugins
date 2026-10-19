import type { Metadata } from "next";
import { ShimmerImage } from "@/components/media/shimmer-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenIcon, ChevronRightIcon } from "lucide-react";
import { getDocPages, getProductBySlug, getProducts } from "@/lib/data/store";
import { contentMetadata } from "@/lib/seo";
import { PRODUCT_TYPE_LABEL } from "@/lib/format";
import { ProductArt } from "@/components/store/product-art";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import { BuyBox } from "@/components/store/product-page/buy-box";
import { ContentBlocksView } from "@/components/store/product-page/content-blocks-view";
import { OfferCards } from "@/components/store/product-page/offer-card";
import { SectionTabs } from "@/components/store/product-page/section-tabs";
import { Reveal } from "@/components/store/product-page/reveal";
import { site } from "@/lang/site";

const t = site.product;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return product
    ? contentMetadata({
        title: product.name,
        description: product.shortDescription,
        image: product.bannerUrl || product.imageUrl,
        path: `/products/${product.slug}`,
      })
    : {};
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [all, docs] = await Promise.all([getProducts(), getDocPages()]);
  const parent = product.parentId ? all.find((p) => p.id === product.parentId) : null;
  const addons = all.filter((p) => p.parentId === product.id);
  const productDocs = docs.filter((d) => d.productId === (parent?.id ?? product.id));
  const related = all.filter((p) => p.id !== product.id && p.type === product.type && p.parentId === product.parentId).slice(0, 3);

  const blocks = product.content;
  // Plain description acts as an intro when no blocks were written yet
  const hasFaq = blocks.some((b) => b.type === "faq");

  const tabs = [
    { id: "overview", label: t.tabs.overview },
    ...(addons.length ? [{ id: "addons", label: t.tabs.addons }] : []),
    ...(productDocs.length ? [{ id: "docs", label: t.tabs.docs }] : []),
    ...(hasFaq ? [{ id: "faq", label: t.tabs.faq }] : []),
  ];

  return (
    <div className="container-page py-8">
      <nav className="flex items-center gap-1 text-xs text-white/50">
        <Link href="/products" className="hover:text-white">{t.breadcrumbStore}</Link>
        <ChevronRightIcon className="size-3" />
        {parent && (
          <>
            <Link href={`/products/${parent.slug}`} className="hover:text-white">{parent.name}</Link>
            <ChevronRightIcon className="size-3" />
          </>
        )}
        <span className="text-white/80">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {/* Header */}
          <div className="flex gap-5">
            <ProductArt product={product} size="sm" sizes="96px" priority className="size-20 shrink-0 rounded-xl ring-1 ring-white/10 sm:size-24" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
                <span className="rounded-md bg-brand/20 px-2 py-0.5 text-xs font-bold text-brand-soft">v{product.version}</span>
              </div>
              <p className="mt-1 text-xs font-bold tracking-[0.14em] text-white/50 uppercase">
                {PRODUCT_TYPE_LABEL[product.type]}
                {product.tagline && ` · ${product.tagline}`}
                {parent && (
                  <>
                    {t.for}
                    <Link href={`/products/${parent.slug}`} className="text-brand-soft hover:underline">{parent.name}</Link>
                  </>
                )}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">{product.shortDescription}</p>
              {product.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.tags.map((t) => (
                    <span key={t} className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <OfferCards product={product} />

          {/* Buy box moves above the content on small screens */}
          <div className="lg:hidden">
            <BuyBox product={product} highlights={product.highlights} />
          </div>

          <SectionTabs tabs={tabs} />

          <div id="overview" className="scroll-mt-20 space-y-24 pt-4">
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
                {product.bannerUrl ? (
                  <div className="relative aspect-[21/9]">
                    <ShimmerImage src={product.bannerUrl} alt="" fill unoptimized priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
                  </div>
                ) : (
                  <ProductArt product={product} size="lg" sizes="(min-width: 1024px) 60vw, 100vw" className="aspect-[21/9] w-full" />
                )}
              </div>
            </Reveal>

            {blocks.length > 0 ? (
              <ContentBlocksView blocks={blocks} product={product} />
            ) : (
              product.description && (
                <Reveal>
                  <section className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold">{t.aboutTitle(product.name)}</h2>
                    <p className="mt-4 leading-relaxed whitespace-pre-line text-white/75">{product.description}</p>
                  </section>
                </Reveal>
              )
            )}
          </div>

          {addons.length > 0 && (
            <section id="addons" className="scroll-mt-20 pt-16">
              <SectionHeading title={t.addonsTitle(product.name)} description={t.addonsDescription} href={`/addons?category=${product.slug}`} />
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {addons.slice(0, 6).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {productDocs.length > 0 && (
            <section id="docs" className="scroll-mt-20 pt-16">
              <SectionHeading title={t.wikiTitle} description={t.wikiDescription} />
              <div className="grid gap-3 sm:grid-cols-2">
                {productDocs.map((d) => (
                  <Link key={d.id} href={`/docs/${d.slug}`} className="group flex items-center gap-3 rounded-lg border border-white/10 bg-[#1a1a1d] p-4 transition hover:border-brand/50">
                    <BookOpenIcon className="size-5 text-brand-soft" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{d.title}</span>
                      <span className="text-xs text-white/50">{d.summary}</span>
                    </span>
                    <ChevronRightIcon className="size-4 text-white/40 transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="pt-16 pb-8">
              <SectionHeading title={t.relatedTitle} description={t.relatedDescription} />
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <BuyBox product={product} highlights={product.highlights} />
          </div>
        </aside>
      </div>
    </div>
  );
}
