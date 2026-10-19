"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SearchIcon } from "lucide-react";

type DocHit = { slug: string; title: string; summary: string; productName: string | null };

export function DocSearch({ docs }: { docs: DocHit[] }) {
  const [query, setQuery] = useState("");
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return docs
      .filter((d) => `${d.title} ${d.summary} ${d.productName ?? ""}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [docs, query]);

  return (
    <div className="relative mx-auto mt-8 max-w-2xl text-left">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/50" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documentation, modules, or API references..."
        aria-label="Search documentation"
        className="h-14 w-full rounded-lg border border-white/10 bg-white/5 pr-4 pl-11 text-sm outline-none backdrop-blur placeholder:text-white/40 focus:border-brand"
      />
      <AnimatePresence>
        {query.trim().length >= 2 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-white/10 bg-[#1c1c1e] shadow-2xl"
          >
            {hits.length === 0 ? (
              <li className="px-4 py-3 text-sm text-white/60">No pages found</li>
            ) : (
              hits.map((d) => (
                <li key={d.slug}>
                  <Link href={`/docs/${d.slug}`} className="block px-4 py-3 transition hover:bg-white/5">
                    <span className="text-sm font-semibold">{d.title}</span>
                    {d.productName && <span className="ml-2 text-xs text-brand-soft">{d.productName}</span>}
                    <span className="block truncate text-xs text-white/60">{d.summary}</span>
                  </Link>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
