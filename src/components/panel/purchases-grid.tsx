"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CloudDownloadIcon, InfoIcon, PackageOpenIcon, SearchIcon } from "lucide-react";
import type { Product } from "@/db/schema";
import { ProductArt } from "@/components/store/product-art";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { PRODUCT_TYPE_LABEL, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { site } from "@/lang/site";

const t = site.purchases;

type Purchase = { product: Product; acquiredAt: string };
type Filter = "all" | Product["type"];

const STAT_TYPES = [
  { key: "plugin", label: t.stats.plugins },
  { key: "model", label: t.stats.models },
  { key: "build", label: t.stats.builds },
] as const;

const SORT_OPTIONS = [
  { value: "recommended", label: t.sorts.recommended },
  { value: "newest", label: t.sorts.newest },
  { value: "name", label: t.sorts.name },
] as const;

export function PurchasesGrid({ purchases }: { purchases: Purchase[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"recommended" | "newest" | "name">("recommended");

  // Add-ons count as plugins in the stats, like the reference
  const kind = (p: Product) => (p.type === "addon" ? "plugin" : p.type);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: purchases.length };
    purchases.forEach(({ product }) => (c[kind(product)] = (c[kind(product)] ?? 0) + 1));
    return c;
  }, [purchases]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = purchases.filter(
      ({ product }) => (filter === "all" || kind(product) === filter) && (!q || product.name.toLowerCase().includes(q)),
    );
    if (sort === "newest") list.sort((a, b) => b.acquiredAt.localeCompare(a.acquiredAt));
    if (sort === "name") list.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return list;
  }, [purchases, query, filter, sort]);

  const chips = (["all", "plugin", "model", "build"] as const).filter((k) => k === "all" || counts[k]);

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t.stats.total} value={purchases.length} />
        {STAT_TYPES.map((s) => (
          <Stat key={s.key} label={s.label} value={counts[s.key] ?? 0} />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchLabel}
            className="h-11 w-full rounded-lg border border-white/10 bg-[#171717] pr-4 pl-11 text-sm outline-none focus:border-brand"
          />
        </div>
        <ChoiceSelect
          value={sort}
          onChange={setSort}
          options={SORT_OPTIONS}
          aria-label={t.sortLabel}
          className="h-11 rounded-lg border-white/10 bg-[#171717] px-4 sm:w-44 dark:bg-[#171717]"
        />
      </div>

      <div className="mt-4 flex gap-2">
        {chips.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition",
              filter === k ? "border-brand-soft/50 bg-brand/15 text-white" : "border-white/10 text-white/70 hover:text-white",
            )}
          >
            {k === "all" ? site.common.all : site.productTypesPlural[k]}
            <span className="rounded-full bg-white/10 px-1.5 text-xs">{counts[k] ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-20 text-center text-white/60">
          <PackageOpenIcon className="size-8" />
          {purchases.length === 0 ? t.emptyNone : t.emptySearch}
          {purchases.length === 0 && (
            <Link href="/products" className="text-sm font-semibold text-brand-soft hover:underline">
              {t.browseStore}
            </Link>
          )}
        </div>
      ) : (
        <motion.div layout className="mt-6 grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map(({ product, acquiredAt }) => (
              <motion.article
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#171717]"
              >
                <div className="relative h-56">
                  <ProductArt product={product} size="md" sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0" />
                  <span className="absolute top-3 left-3 rounded-md border border-yellow-400/50 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-yellow-300 uppercase">
                    {PRODUCT_TYPE_LABEL[product.type]}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="mt-1 text-xs text-white/50">
                    {t.meta(product.version, timeAgo(new Date(acquiredAt)))}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`/api/download/${product.id}`}
                      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#c4b5fd] text-sm font-bold text-[#1e1442] transition hover:bg-[#c4b5fd]/85"
                    >
                      <CloudDownloadIcon className="size-4" /> {t.download}
                    </a>
                    <Link
                      href={`/products/${product.slug}`}
                      aria-label={t.details}
                      className="grid size-10 place-items-center rounded-md border border-white/10 text-white/70 transition hover:text-white"
                    >
                      <InfoIcon className="size-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#171717] p-6">
      <p className="text-[11px] font-bold tracking-[0.14em] text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
