import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { getDocBySlug, getDocPages, getProducts } from "@/lib/data/store";
import { contentMetadata } from "@/lib/seo";
import { DocContent } from "@/components/store/doc-content";
import { cn } from "@/lib/utils";
import { site } from "@/lang/site";

export async function generateStaticParams() {
  const docs = await getDocPages();
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);
  return doc ? contentMetadata({ title: site.meta.pages.docTitle(doc.title), description: doc.summary, path: `/docs/${doc.slug}` }) : {};
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);
  if (!doc) notFound();

  const [docs, products] = await Promise.all([getDocPages(), getProducts()]);
  const product = doc.productId ? products.find((p) => p.id === doc.productId) : null;
  const siblings = docs.filter((d) => d.productId === doc.productId);
  const index = siblings.findIndex((d) => d.id === doc.id);
  const next = siblings[index + 1];

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit lg:sticky lg:top-6">
        <Link href="/docs" className="inline-flex items-center gap-1 text-sm text-white/60 transition hover:text-white">
          <ChevronLeftIcon className="size-4" /> {site.docs.allDocs}
        </Link>
        <p className="mt-6 text-xs font-bold tracking-[0.18em] text-brand-soft uppercase">{product?.name ?? site.docs.resourcesSidebar}</p>
        <nav className="mt-3 flex flex-col border-l border-white/10">
          {siblings.map((d) => (
            <Link
              key={d.id}
              href={`/docs/${d.slug}`}
              className={cn(
                "-ml-px border-l-2 py-1.5 pl-4 text-sm transition",
                d.id === doc.id ? "border-brand font-semibold text-white" : "border-transparent text-white/60 hover:text-white",
              )}
            >
              {d.title}
            </Link>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">{doc.title}</h1>
        {doc.summary && <p className="mt-3 text-lg text-white/70">{doc.summary}</p>}
        <div className="mt-6 border-t border-white/5 pt-2">
          <DocContent source={doc.content} />
        </div>
        {next && (
          <Link
            href={`/docs/${next.slug}`}
            className="mt-12 flex items-center justify-between rounded-lg border border-white/10 p-5 transition hover:border-brand"
          >
            <span>
              <span className="block text-xs text-white/50">{site.common.next}</span>
              <span className="font-semibold">{next.title}</span>
            </span>
            <span className="text-xl">→</span>
          </Link>
        )}
      </article>
    </div>
  );
}
