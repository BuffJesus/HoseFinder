// Big tactile ticker in the hero area. Shows total parts when idle, narrows
// live as filters engage. Plays a subtle amber treatment when the count
// crosses zero so "no matches" reads without needing to re-read the number.

import React from "react";
import { motion } from "framer-motion";
import { AnimatedCount } from "./AnimatedCount.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/** @param {{ total: number, filtered: number, hasFilters: boolean }} props */
export function HeroLiveCount({ total, filtered, hasFilters }) {
  const value = hasFilters ? filtered : total;
  const pct = total ? Math.min(100, (filtered / total) * 100) : 0;
  const empty = hasFilters && filtered === 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      aria-label={hasFilters ? `${filtered} matching parts of ${total}` : `${total} parts indexed`}
      className="relative w-full max-w-xs lg:w-[20rem]"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-3 rounded-[40px] blur-2xl transition-opacity duration-500 ${
          empty ? "bg-amber-500/15 opacity-100" : "bg-violet-600/20 opacity-70"
        }`}
      />
      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 p-5 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(160deg, rgba(24,24,30,0.92), rgba(12,12,18,0.92))",
          boxShadow:
            "0 24px 80px -24px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-70`} />
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            {hasFilters ? "Matching now" : "Indexed parts"}
          </div>
          <div className={`text-[10px] uppercase tracking-[0.22em] ${empty ? "text-amber-300" : "text-violet-300"}`}>
            {hasFilters ? `${pct.toFixed(pct < 10 ? 1 : 0)}%` : "100%"}
          </div>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <div className="text-[56px] font-semibold leading-none tracking-[-0.04em] tabular text-white">
            <AnimatedCount value={value} />
          </div>
          <div className="pb-2 text-sm text-zinc-500 tabular">
            / {total.toLocaleString()}
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={false}
            animate={{ width: `${hasFilters ? pct : 100}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
            className={`h-full rounded-full ${
              empty
                ? "bg-gradient-to-r from-amber-500 to-orange-400"
                : `bg-gradient-to-r ${ACCENT}`
            }`}
          />
        </div>
        <div className="mt-3 text-xs leading-5 text-zinc-400">
          {empty
            ? "No exact matches — relax the tolerance below to widen the field."
            : hasFilters
              ? "Refining live as you adjust filters."
              : "Every Gates molded coolant hose, ready to filter."}
        </div>
      </div>
    </motion.div>
  );
}
