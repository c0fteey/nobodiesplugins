"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Announcement } from "@/db/schema";
import { cn } from "@/lib/utils";

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
      className="container-page relative h-[70px] sm:h-[84px]"
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
          className="absolute inset-x-4 inset-y-0 flex items-center justify-between gap-4 sm:inset-x-6"
        >
          <div className="mx-auto flex flex-col items-start gap-1 sm:mx-0 sm:pl-[16%]">
            <p className="text-sm font-bold tracking-tight text-[#b9a6ff] sm:text-lg">{current.title}</p>
            <p className="flex items-center gap-2 text-xs font-semibold text-white sm:text-sm">
              {current.badge && <span className="rounded-full bg-brand px-2 py-0.5">{current.badge}</span>}
              {current.text}
            </p>
          </div>
          {current.cta && (
            <Link
              href={current.href || "/products"}
              className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand/85 sm:mr-[16%] sm:px-5 sm:py-2.5 sm:text-base"
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
              aria-label={`Show announcement ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn("h-1 rounded-full transition-all", i === index % count ? "w-5 bg-white" : "w-1.5 bg-white/40")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
