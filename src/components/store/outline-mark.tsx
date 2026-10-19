"use client";

import { motion, useReducedMotion } from "framer-motion";

// Voxels orbiting the monogram: [orbit radius, start angle, size, color, seconds per turn]
const VOXELS = [
  [176, 20, 16, "#fde047", 30],
  [176, 200, 11, "#f472b6", 30],
  [148, 110, 9, "#a78bfa", -38],
  [148, 290, 13, "#7c5cff", -38],
] as const;

const ease = [0.65, 0, 0.35, 1] as const;
// Longer than the glyph outlines, so the dash fully covers them once drawn
const DASH = 3000;

/** Endless rotation around the artwork's center (200,200); still when the user prefers less motion. */
function Spin({ seconds, from = 0, still }: { seconds: number; from?: number; still: boolean }) {
  if (still) return null;
  const to = from + (seconds < 0 ? -360 : 360);
  return (
    <animateTransform
      attributeName="transform"
      type="rotate"
      from={`${from} 200 200`}
      to={`${to} 200 200`}
      dur={`${Math.abs(seconds)}s`}
      repeatCount="indefinite"
    />
  );
}

/** About page hero art: the NB monogram drawing itself inside rings, with orbiting pixel blocks. */
export function OutlineMark() {
  const still = !!useReducedMotion();

  return (
    <div className="mx-auto hidden w-full max-w-[440px] lg:block" aria-hidden>
      <svg viewBox="0 0 400 400" className="w-full overflow-visible">
        <defs>
          <linearGradient id="nb-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="55%" stopColor="#8b6dff" />
            <stop offset="100%" stopColor="#5b2bff" />
          </linearGradient>
          <linearGradient id="nb-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
          <radialGradient id="nb-glow">
            <stop offset="0%" stopColor="#5b2bff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#5b2bff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* soft breathing glow */}
        <motion.circle
          cx="200"
          cy="200"
          r="175"
          fill="url(#nb-glow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: still ? 1 : [0.55, 1, 0.55] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* slow dashed outer ring */}
        <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1" strokeDasharray="2 9">
          <Spin seconds={90} still={still} />
        </circle>

        {/* main ring draws itself, starting at the top */}
        <motion.circle
          cx="200"
          cy="200"
          r="164"
          fill="none"
          stroke="url(#nb-stroke)"
          strokeWidth="2"
          strokeLinecap="round"
          transform="rotate(-90 200 200)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease }}
        />
        <circle cx="200" cy="200" r="136" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1" />

        {/* orbiting voxels */}
        {VOXELS.map(([radius, angle, size, color, seconds], i) => (
          <g key={i} transform={`rotate(${angle} 200 200)`}>
            <Spin seconds={seconds} from={angle} still={still} />
            <rect
              x={200 - size / 2}
              y={200 - radius - size / 2}
              width={size}
              height={size}
              rx={2}
              fill={color}
              stroke="rgba(0,0,0,.3)"
              strokeWidth="1.5"
            />
            <rect x={200 - size / 2 + 2} y={200 - radius - size / 2 + 2} width={size / 3} height={size / 3} fill="rgba(255,255,255,.5)" />
          </g>
        ))}

        {/* monogram: 3D shadow, an outline that draws itself, then the fill fades in */}
        <motion.text
          x="205"
          y="250"
          textAnchor="middle"
          className="font-logo"
          fontSize="128"
          fontWeight="800"
          letterSpacing="-8"
          fill="#2a1690"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          NB
        </motion.text>
        <motion.text
          x="200"
          y="245"
          textAnchor="middle"
          className="font-logo"
          fontSize="128"
          fontWeight="800"
          letterSpacing="-8"
          stroke="url(#nb-stroke)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="url(#nb-fill)"
          // The outline also traces the font's inner contours, so it fades out once the fill is in
          initial={{ strokeDasharray: DASH, strokeDashoffset: DASH, fillOpacity: 0, strokeOpacity: 1 }}
          animate={{ strokeDashoffset: 0, fillOpacity: 1, strokeOpacity: 0 }}
          transition={{
            strokeDashoffset: { duration: 2.2, ease, delay: 0.3 },
            fillOpacity: { duration: 0.9, delay: 2.1 },
            strokeOpacity: { duration: 0.6, delay: 2.8 },
          }}
        >
          NB
        </motion.text>
      </svg>
    </div>
  );
}
