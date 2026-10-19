"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Sticky in-page tabs that highlight the section currently on screen. */
export function SectionTabs({ tabs }: { tabs: { id: string; label: string }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    tabs.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tabs]);

  return (
    <nav className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-background/85 px-4 backdrop-blur-xl sm:mx-0 sm:px-0">
      <div className="scrollbar-none flex gap-6 overflow-x-auto">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={cn(
              "relative shrink-0 py-4 text-sm font-semibold transition",
              active === t.id ? "text-white" : "text-white/55 hover:text-white",
            )}
          >
            {t.label}
            {active === t.id && (
              <motion.span layoutId="product-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-soft" />
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
