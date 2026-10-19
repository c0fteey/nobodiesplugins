"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Announcement } from "@/db/schema";
import { cn } from "@/lib/utils";
import { site } from "@/lang/site";

const INTERVAL_MS = 5000;

/** Banners slide in from the right and out to the left; pauses while hovered. */
export function AnnouncementCarousel({ announcements }: { announcements: Announcement[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = announcements.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  const current = announcements[index % count];

  return (
    <div
      className="container-page relative h-[70px] overflow-hidden sm:h-[84px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={index}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
          className="absolute inset-x-4 inset-y-0 flex items-center justify-between gap-3 pb-2 sm:inset-x-6 sm:gap-4 sm:pb-0"
        >
          <div className="flex min-w-0 flex-col items-start gap-1 sm:pl-[16%]">
            <p className="max-w-full truncate text-[13px] font-bold tracking-tight text-[#b9a6ff] sm:text-lg">{current.title}</p>
            <p className="flex max-w-full items-center gap-2 text-[11px] font-semibold text-white sm:text-sm">
              {current.badge && <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 whitespace-nowrap">{current.badge}</span>}
              <span className="truncate">{current.text}</span>
            </p>
          </div>
          {current.cta && (
            <Link
              href={current.href || "/products"}
              className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-lg shadow-brand/30 transition hover:bg-brand/85 sm:mr-[16%] sm:px-5 sm:py-2.5 sm:text-base"
            >
              {current.cta} →
            </Link>
          )}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {announcements.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={site.nav.showAnnouncement(i + 1)}
              onClick={() => setIndex(i)}
              className={cn("h-1 rounded-full transition-all", i === index % count ? "w-5 bg-white" : "w-1.5 bg-white/40")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
