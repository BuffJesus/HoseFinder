// Hose silhouette renderer. Each `type` maps to a single SVG path; the
// parent sets its own container size. Pure + stateless. `MorphingHoseSilhouette`
// is the hover-cycling variant used on the three flow-card CTAs to hint at
// the range of shapes a flow type covers.

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** @type {Record<string, string[]>} */
export const SILHOUETTE_FAMILIES = {
  single:   ["wideArc", "long", "gentle", "sweep"],
  reducer:  ["Zturn", "elbow", "shortElbow", "hook"],
  branched: ["branch", "branchY", "branchFour"],
};

const PATHS = {
  elbow:      "M30 92 C30 58, 56 30, 98 30 L224 30",
  shortElbow: "M38 88 C38 62, 60 38, 88 38 L140 38",
  sweep:      "M18 80 C52 80, 56 38, 92 38 S138 88, 174 88 S210 52, 240 52",
  compound:   "M18 82 C58 82, 56 32, 92 32 S132 88, 170 88 S205 48, 240 48",
  deepS:      "M22 90 C48 90, 46 26, 80 26 S120 94, 156 94 S198 42, 232 42",
  long:       "M18 70 C80 70, 110 28, 168 28 S218 54, 244 58",
  wideArc:    "M18 75 C90 75, 172 42, 244 42",
  gentle:     "M18 65 C80 65, 160 55, 244 55",
  hook:       "M40 30 C40 80, 70 95, 120 95 L210 95",
  Zturn:      "M20 36 L95 36 C115 36, 118 82, 138 82 L222 82",
  branch:     "M22 70 L218 70 M120 70 L120 24",
  branchY:    "M22 72 L130 72 L130 28 M130 72 L218 72",
  branchFour: "M22 72 L218 72 M90 72 L90 26 M158 72 L158 26",
};

/**
 * Render a hose silhouette. When a `polyline` array (from shape_signatures)
 * is provided, renders the hose's ACTUAL extracted centerline instead of
 * the generic category icon. Falls back to the category SVG when polyline
 * data isn't available.
 *
 * @param {{ type: string, color?: string, polyline?: number[][] }} props
 */
export function HoseSilhouette({ type, color = "currentColor", polyline }) {
  // Per-hose polyline: render the real extracted shape.
  if (polyline && polyline.length >= 2) {
    const d = polyline.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
    return (
      <svg viewBox="-5 -5 110 110" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // Fallback: generic category icon.
  const d = PATHS[type] || PATHS.sweep;
  const isBranch = type?.startsWith("branch");
  return (
    <svg viewBox="0 0 260 120" className="h-full w-full" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={isBranch ? 14 : 16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** @param {{ family: string, color?: string }} props */
export function MorphingHoseSilhouette({ family, color = "currentColor" }) {
  const types = SILHOUETTE_FAMILIES[family] || [family];
  const [hover, setHover] = useState(false);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!hover || types.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % types.length), 1300);
    return () => clearInterval(id);
  }, [hover, types.length]);
  useEffect(() => {
    if (!hover) setIdx(0);
  }, [hover]);
  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={types[idx]}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <HoseSilhouette type={types[idx]} color={color} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
