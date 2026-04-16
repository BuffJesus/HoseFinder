// Sticky header above the result cards. Shows "N hoses", exact/close match
// chips, view-mode toggle (grid/list/compact), and sort-by dropdown. Sticks
// to the top of the scroll container so the counts and controls are always
// in reach when the user is scanning a long list.

import React from "react";
import { motion } from "framer-motion";
import { Check, LayoutGrid, List, Table2, ArrowUpDown, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedCount } from "./AnimatedCount.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

const VIEW_OPTIONS = [
  { key: "grid",    icon: LayoutGrid, label: "Grid"    },
  { key: "list",    icon: List,       label: "List"    },
  { key: "compact", icon: Table2,     label: "Compact" },
];

/**
 * @param {{
 *   loading: boolean,
 *   canShowResults: boolean,
 *   hasActiveFilters: boolean,
 *   filteredCount: number,
 *   exactCount: number,
 *   closeCount: number,
 *   viewMode: "grid" | "list" | "compact",
 *   setViewMode: (mode: "grid" | "list" | "compact") => void,
 *   sortMode: string,
 *   setSortMode: (mode: string) => void,
 * }} props
 */
export function ResultsHeader({
  loading,
  canShowResults,
  hasActiveFilters,
  filteredCount,
  exactCount,
  closeCount,
  viewMode,
  setViewMode,
  sortMode,
  setSortMode,
}) {
  return (
    <div
      className="sticky top-3 z-30 mb-5 overflow-hidden rounded-[28px] border border-white/10 backdrop-blur-xl"
      style={{
        background: "linear-gradient(160deg, rgba(20,20,26,0.78), rgba(10,10,16,0.78))",
        boxShadow: "0 16px 50px -18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-50`} />
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Results</div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
            <div className="flex items-baseline gap-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {loading ? (
                <span className="flex items-center gap-2 text-base text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  Loading catalog…
                </span>
              ) : canShowResults ? (
                <>
                  <span className="tabular"><AnimatedCount value={filteredCount} /></span>
                  <span className="text-sm font-normal text-zinc-400">
                    hose{filteredCount !== 1 ? "s" : ""}
                  </span>
                </>
              ) : (
                <span className="text-base text-zinc-400">Enter a size to start narrowing</span>
              )}
            </div>
            {hasActiveFilters && filteredCount > 0 && canShowResults && (
              <div className="flex flex-wrap items-center gap-1.5">
                {exactCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tabular text-emerald-300">
                    <Check className="h-2.5 w-2.5" /> {exactCount} exact
                  </span>
                )}
                {closeCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold tabular text-sky-300">
                    {closeCount} close
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div
            role="radiogroup"
            aria-label="View mode"
            className="relative flex items-center gap-0.5 rounded-2xl border border-white/10 bg-white/[0.04] p-1"
          >
            {VIEW_OPTIONS.map((option) => {
              const active = viewMode === option.key;
              const Icon = option.icon;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-label={option.label}
                  aria-checked={active}
                  onClick={() => setViewMode(option.key)}
                  className={`relative flex h-8 w-9 items-center justify-center rounded-xl text-zinc-400 transition ${
                    active ? "text-white" : "hover:bg-white/[0.06] hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="viewModePill"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br ${ACCENT} shadow-[0_8px_22px_-8px_rgba(139,92,246,0.6)]`}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                  <Icon className="relative h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] pl-2.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <Select value={sortMode} onValueChange={setSortMode}>
              <SelectTrigger className="h-9 w-40 rounded-2xl border-0 bg-transparent text-xs text-zinc-200" aria-label="Sort results by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Best match</SelectItem>
                <SelectItem value="id">By diameter</SelectItem>
                <SelectItem value="len">By length</SelectItem>
                <SelectItem value="part">By part number</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
