// Progressive-depth "Refine results" surface — a disclosure button at
// the top and an animated panel body below. Same control on every
// viewport (no more separate mobile bottom sheet) — one surface, one
// interaction pattern. The body is `children` so the parent can drop
// in FilterPanelContent (or anything else) without this component
// knowing about the filter shape.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   open: boolean,
 *   onToggle: () => void,
 *   hasActiveFilters: boolean,
 *   label: string,
 *   subtitle: string,
 *   children?: React.ReactNode,
 * }} props
 */
export function RefineDisclosure({ open, onToggle, hasActiveFilters, label, subtitle, children }) {
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-violet-400/30 hover:bg-white/[0.06]"
      >
        <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
          <SlidersHorizontal className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
          {label}
          {hasActiveFilters && (
            <span
              className={`inline-flex h-1.5 w-1.5 rounded-full bg-gradient-to-r ${ACCENT} shadow-[0_0_8px_rgba(217,70,239,0.7)]`}
              aria-label="filters active"
            />
          )}
          <span className="text-xs text-zinc-400">{subtitle}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition ${open ? "rotate-180 text-violet-300" : ""}`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.aside
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-3 overflow-hidden rounded-[32px] border border-white/10 backdrop-blur-xl"
              style={{
                background:
                  "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.08), transparent 60%)," +
                  "linear-gradient(180deg, rgba(20,20,28,0.7), rgba(10,10,15,0.7))",
                boxShadow:
                  "0 24px 80px -28px rgba(139,92,246,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-60`} />
              {children}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
