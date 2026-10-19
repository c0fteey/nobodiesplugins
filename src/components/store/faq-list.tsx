"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import type { Faq } from "@/db/schema";
import { cn } from "@/lib/utils";

/** FAQ accordion; `variant="large"` matches the Help page, "compact" the Docs page. */
export function FaqList({ faqs, variant = "compact", defaultOpen }: { faqs: Faq[]; variant?: "compact" | "large"; defaultOpen?: string }) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);

  return (
    <div className={cn(variant === "compact" ? "divide-y divide-white/5" : "space-y-6")}>
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <div key={faq.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : faq.id)}
              aria-expanded={open}
              className={cn(
                "flex w-full items-start gap-6 text-left font-semibold transition hover:text-white",
                variant === "compact" ? "justify-between py-3 text-sm text-white/90" : "py-2 text-lg",
              )}
            >
              {variant === "large" && (
                <ChevronRightIcon className={cn("mt-1 size-4 shrink-0 text-white/60 transition-transform", open && "rotate-90")} />
              )}
              <span>{faq.question}</span>
              {variant === "compact" && (
                <ChevronDownIcon className={cn("size-4 shrink-0 text-white/50 transition-transform", open && "rotate-180")} />
              )}
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p
                    className={cn(
                      "whitespace-pre-line text-white/75",
                      variant === "compact" ? "pb-4 text-sm" : "pt-3 pl-10 text-lg leading-relaxed",
                    )}
                  >
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
