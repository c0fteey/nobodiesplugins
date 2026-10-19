"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MinusIcon, PlusIcon, SearchIcon, SearchXIcon, SlidersHorizontalIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Product } from "@/db/schema";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { Slider } from "@/components/ui/slider";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductArt } from "./product-art";
import { ProductCard } from "./product-card";
import { site } from "@/lang/site";

const t = site.browser;

export type BrowserCategory = { value: string; label: string; match: (p: Product) => boolean };

const SORTS = {
  relevance: { label: t.sorts.relevance, fn: (a: Product, b: Product) => a.sortOrder - b.sortOrder },
  "price-asc": { label: t.sorts.priceAsc, fn: (a: Product, b: Product) => a.priceCents - b.priceCents },
  "price-desc": { label: t.sorts.priceDesc, fn: (a: Product, b: Product) => b.priceCents - a.priceCents },
  newest: { label: t.sorts.newest, fn: (a: Product, b: Product) => +new Date(b.createdAt) - +new Date(a.createdAt) },
} as const;
type SortKey = keyof typeof SORTS;
const SORT_OPTIONS = (Object.keys(SORTS) as SortKey[]).map((value) => ({ value, label: SORTS[value].label }));

export function ProductBrowser({
  products,
  categories,
  allLabel = site.common.all,
}: {
  products: Product[];
  categories: BrowserCategory[];
  allLabel?: string;
}) {
  const params = useSearchParams();
  const initialCategory = categories.some((c) => c.value === params.get("category")) ? params.get("category")! : "all";

  const maxEuro = Math.max(1, Math.ceil(Math.max(...products.map((p) => p.priceCents), 0) / 100));
  const allTags = useMemo(() => [...new Set(products.flatMap((p) => p.tags))].sort(), [products]);
  const allVersions = useMemo(
    () =>
      [...new Set(products.flatMap((p) => p.mcVersions))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [products],
  );

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState(initialCategory);
  const [price, setPrice] = useState<number[]>([0, maxEuro]);
  const [tags, setTags] = useState<string[]>([]);
  const [version, setVersion] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const cat = categories.find((c) => c.value === category);
    return products
      .filter(
        (p) =>
          (!cat || cat.match(p)) &&
          p.priceCents >= price[0] * 100 &&
          p.priceCents <= price[1] * 100 &&
          tags.every((t) => p.tags.includes(t)) &&
          (!version || p.mcVersions.includes(version)) &&
          (!q || p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q)),
      )
      .sort(SORTS[sort].fn);
  }, [products, categories, category, price, tags, version, sort, deferredQuery]);

  const popular = products.filter((p) => p.featured).slice(0, 3);
  const toggleTag = (tag: string) => setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const activeFilters =
    (category !== "all" ? 1 : 0) + tags.length + (version ? 1 : 0) + (price[0] > 0 || price[1] < maxEuro ? 1 : 0);
  const resetFilters = () => {
    setCategory("all");
    setPrice([0, maxEuro]);
    setTags([]);
    setVersion(null);
  };

  const searchBox = (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchLabel}
        className="h-10 w-full rounded-full border border-white/10 bg-transparent pr-9 pl-4 text-sm outline-none placeholder:text-white/40 focus:border-brand"
      />
      <SearchIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white/50" />
    </div>
  );

  const filters = (
    <>

      <FilterGroup title={t.category}>
        <div className="flex flex-wrap gap-1.5">
          {[{ value: "all", label: allLabel }, ...categories].map((c) => (
            <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={t.price}>
        <Slider
          value={price}
          min={0}
          max={maxEuro}
          step={1}
          onValueChange={(v) => setPrice(Array.isArray(v) ? [...v] : [0, v])}
          className="mt-2 [&_[data-slot=slider-range]]:bg-brand [&_[data-slot=slider-thumb]]:border-brand"
          aria-label={t.priceRange}
        />
        <div className="mt-2 flex justify-between text-xs text-white/60">
          <span>€{price[0]}</span>
          <span>€{price[1]}</span>
        </div>
      </FilterGroup>

      {allTags.length > 0 && (
        <FilterGroup title={t.tags}>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <Chip key={tag} active={tags.includes(tag)} onClick={() => toggleTag(tag)} subtle>
                {tag}
              </Chip>
            ))}
          </div>
        </FilterGroup>
      )}

      {allVersions.length > 0 && (
        <FilterGroup title={t.mcVersion}>
          <div className="relative flex justify-between pt-1">
            <span aria-hidden className="absolute top-[11px] right-2 left-2 h-px bg-white/20" />
            {allVersions.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVersion((cur) => (cur === v ? null : v))}
                className="relative flex flex-col items-center gap-1.5"
                aria-pressed={version === v}
              >
                <span
                  className={cn(
                    "size-3.5 rounded-full border-2 bg-[#1a1a1c] transition",
                    version === v ? "border-brand bg-brand" : "border-white/40",
                  )}
                />
                <span className="text-[10px] text-white/70">{v}</span>
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title={t.sortBy}>
        <ChoiceSelect
          value={sort}
          onChange={setSort}
          options={SORT_OPTIONS}
          aria-label={t.sortLabel}
          className="h-9 rounded-md border-white/10 bg-[#141414] px-3 text-xs dark:bg-[#141414]"
        />
      </FilterGroup>

      {popular.length > 0 && (
        <FilterGroup title={t.popular}>
          <ul className="space-y-3">
            {popular.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.slug}`} className="flex items-center gap-3 transition hover:text-brand-soft">
                  <ProductArt product={p} size="sm" sizes="40px" className="size-10 shrink-0 rounded" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{p.name}</span>
                    <span className="text-[11px] text-white/60">
                      {p.compareAtCents && <s className="mr-1">{formatPrice(p.compareAtCents)}</s>}
                      {formatPrice(p.priceCents)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}
    </>
  );

  return (
    <div className="container-page grid gap-6 py-8 sm:py-12 lg:grid-cols-[230px_1fr] lg:gap-8 lg:py-16">
      {/* Phones and tablets: search + filters in a bottom sheet, so products come first */}
      <div className="flex gap-2 lg:hidden">
        <div className="min-w-0 flex-1">{searchBox}</div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-[#1a1a1c] px-4 text-sm font-semibold"
              />
            }
          >
            <SlidersHorizontalIcon className="size-4" /> {t.filters}
            {activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold">{activeFilters}</span>}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-2xl border-white/10 bg-[#1a1a1c] p-0">
            <SheetTitle className="px-5 pt-5 pb-1 text-lg font-bold">{t.filters}</SheetTitle>
            <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-2 text-sm">{filters}</div>
            <div className="flex gap-2 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={resetFilters} className="h-11 rounded-full border border-white/15 px-5 text-sm font-semibold">
                {t.clearFilters}
              </button>
              <SheetClose className="h-11 flex-1 rounded-full bg-brand text-sm font-semibold text-white">{t.showResults(visible.length)}</SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: sticks right under the 68px site header and scrolls on its own when taller than the screen */}
      <aside className="scrollbar-thin hidden h-fit self-start rounded-xl bg-[#1a1a1c] p-4 text-sm lg:sticky lg:top-[84px] lg:block lg:max-h-[calc(100dvh-100px)] lg:overflow-y-auto lg:overscroll-contain">
        {searchBox}
        {filters}
      </aside>

      <div>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-24 text-center text-white/60">
            <SearchXIcon className="size-8" />
            {t.empty}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 xl:grid-cols-3 xl:gap-x-8">
            <AnimatePresence mode="popLayout">
              {visible.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-white/5 py-4 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between text-sm font-semibold"
        aria-expanded={open}
      >
        {title}
        {open ? <MinusIcon className="size-3.5 text-white/50" /> : <PlusIcon className="size-3.5 text-white/50" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  active,
  subtle,
  onClick,
  children,
}: {
  active: boolean;
  subtle?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs transition",
        active ? "bg-brand text-white" : subtle ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-white/10 text-white/80 hover:bg-white/15",
      )}
    >
      {children}
    </button>
  );
}
