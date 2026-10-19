"use client";

import { motion } from "framer-motion";

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
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
        <motion.text
          x="200"
          y="252"
          textAnchor="middle"
          className="font-logo"
          fontSize="170"
          fontWeight="800"
          fill="transparent"
          stroke="white"
          strokeWidth="1.5"
          letterSpacing="-14"
          initial={{ strokeDasharray: 1400, strokeDashoffset: 1400 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.3 }}
        >
          NB
        </motion.text>
      </svg>
    </div>
  );
}
