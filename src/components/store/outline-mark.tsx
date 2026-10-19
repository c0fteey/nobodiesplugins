"use client";

import { motion } from "framer-motion";

// Longer than the glyph outlines, so the dash fully covers them once drawn
const DASH = 3000;
const ease = [0.65, 0, 0.35, 1] as const;

const text = {
  x: 200,
  y: 249,
  textAnchor: "middle",
  className: "font-logo",
  fontSize: 158,
  fontWeight: 800,
  letterSpacing: -13,
} as const;

/** Big outlined "NB" monogram that draws itself in, inside a ring. */
export function OutlineMark() {
  return (
    <div className="mx-auto hidden w-full max-w-[420px] lg:block" aria-hidden>
      <svg viewBox="0 0 400 400" className="w-full">
        <motion.circle
          cx="200"
          cy="200"
          r="170"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          transform="rotate(-90 200 200)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease }}
        />
        {/* The stroke is twice the visible width; the page-colored fill on top hides its
            inner half and the font's overlapping inner contours, leaving one clean outline. */}
        <motion.text
          {...text}
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          initial={{ strokeDasharray: DASH, strokeDashoffset: DASH }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2.4, ease, delay: 0.3 }}
        >
          NB
        </motion.text>
        <text {...text} fill="var(--background)">
          NB
        </text>
      </svg>
    </div>
  );
}
