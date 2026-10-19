import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BoxIcon,
  CircleHelpIcon,
  HeadsetIcon,
  MessagesSquareIcon,
  PuzzleIcon,
  RocketIcon,
  StoreIcon,
  SwordsIcon,
} from "lucide-react";
import { getDocPages, getFaqs, getProducts, getSettings } from "@/lib/data/store";
import { DocSearch } from "@/components/store/doc-search";
import { FaqList } from "@/components/store/faq-list";
import { ProductArt } from "@/components/store/product-art";
import { site } from "@/lang/site";

const t = site.docs;

export const metadata: Metadata = { title: site.meta.pages.docs };

const ICONS = [BoxIcon, StoreIcon, SwordsIcon, PuzzleIcon];

export default async function DocsPage() {
  const [products, docs, faqs, settings] = await Promise.all([getProducts(), getDocPages(), getFaqs(), getSettings()]);
  const plugins = products.filter((p) => p.type === "plugin");
  const productName = new Map(products.map((p) => [p.id, p.name]));
  const general = docs.filter((d) => !d.productId);

  return (
    <div className="bg-[radial-gradient(ellipse_at_top,#2a1a6b_0%,transparent_55%)]">
      <section className="container-page pt-14 pb-16 text-center">
        <h1 className="text-5xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-6xl">
          {t.titleLine1}
          <br />
          <span className="text-brand-soft">{t.titleLine2}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-sm text-white/70">
          {t.lead}
        </p>
        <DocSearch
          docs={docs.map((d) => ({
            slug: d.slug,
            title: d.title,
            summary: d.summary,
            productName: d.productId ? (productName.get(d.productId) ?? null) : null,
          }))}
        />
      </section>

      <section className="container-page space-y-6">
        {plugins.map((plugin, i) => {
          const pages = docs.filter((d) => d.productId === plugin.id);
          const Icon = ICONS[i % ICONS.length];
          return (
            <article key={plugin.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#1b1b22]/90 p-8">
              <ProductArt
                product={plugin}
                size="sm"
                sizes="40vw"
                className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.12] [mask-image:linear-gradient(90deg,transparent,#000)] transition duration-700 group-hover:opacity-20"
              />
              <Icon className="relative size-7 text-brand-soft" strokeWidth={1.6} />
              <h2 className="relative mt-5 text-2xl font-semibold">{plugin.name}</h2>
              <p className="relative mt-3 max-w-md text-sm leading-relaxed text-white/75">{plugin.shortDescription}</p>
              {pages.length > 0 ? (
                <Link
                  href={`/docs/${pages[0].slug}`}
                  className="relative mt-6 inline-flex h-9 items-center gap-2 rounded-sm bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/85"
                >
                  {t.viewDocs} <ArrowRightIcon className="size-4" />
                </Link>
              ) : (
                <p className="relative mt-6 text-xs text-white/50">{t.comingSoon}</p>
              )}
            </article>
          );
        })}
      </section>

      <section className="container-page mt-16">
        <p className="text-xs font-bold tracking-[0.2em] text-brand-soft">{t.latestBuilds}</p>
        <div className="mt-4 space-y-3">
          {plugins.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="block rounded-md border-l-2 border-brand bg-[#1c1c20] px-4 py-3 transition hover:bg-[#232329]"
            >
              <p className="font-mono text-[11px] text-white/50">{t.buildLabel(p.version)}</p>
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-white/60">{p.changelog ?? t.defaultChangelog}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <p className="text-xs font-bold tracking-[0.2em] text-brand-soft">{t.resources}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {general.map((d) => (
            <ResourceTile key={d.id} href={`/docs/${d.slug}`} icon={<RocketIcon className="size-5" />} label={d.title} />
          ))}
          <ResourceTile href="/help" icon={<CircleHelpIcon className="size-5" />} label={t.helpCenter} />
          <ResourceTile href={settings.discordUrl} external icon={<MessagesSquareIcon className="size-5" />} label={t.discordCommunity} />
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="container-page mt-24">
          <h2 className="text-3xl font-bold">{t.faqTitle}</h2>
          <div className="mt-8">
            <FaqList faqs={faqs} />
          </div>
        </section>
      )}

      <section className="container-page mt-16 pb-24">
        <div className="rounded-xl border border-white/5 bg-[#1b1a2b] p-8">
          <HeadsetIcon className="size-8 text-brand-soft" strokeWidth={1.6} />
          <h2 className="mt-5 text-3xl font-bold">{t.needHelpTitle}</h2>
          <p className="mt-3 text-sm text-white/70">
            {t.needHelpText}
          </p>
          <div className="mt-6 grid gap-3">
            <a
              href={settings.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center rounded-sm bg-brand text-sm font-semibold text-white transition hover:bg-brand/85"
            >
              {site.common.joinDiscord}
            </a>
            <a
              href={`mailto:${settings.supportEmail}`}
              className="flex h-11 items-center justify-center rounded-sm bg-white/5 text-sm font-semibold transition hover:bg-white/10"
            >
              {t.contactEmail}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResourceTile({ href, icon, label, external }: { href: string; icon: React.ReactNode; label: string; external?: boolean }) {
  const className =
    "flex flex-col items-center justify-center gap-2 rounded-md border border-white/5 bg-[#1c1c20] py-6 text-xs font-semibold transition hover:border-brand/50 hover:bg-[#232329]";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {icon}
      {label}
    </a>
  ) : (
    <Link href={href} className={className}>
      {icon}
      {label}
    </Link>
  );
}
