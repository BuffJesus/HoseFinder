// Shape browser surface. Three-stage disclosure:
//   1. Application chip (Heater / Radiator / Heavy / Branched / All)
//   2. Silhouette-family cards within that application, ranked by count
//   3. Catalog-page thumbs hidden behind a power-user expander
// Replaces the old "171-thumbnail dump" with something a hobbyist can
// parse without knowing catalog structure.

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers3, Flame, Snowflake, Shield, GitFork, Check, ChevronRight, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoseSilhouette } from "./HoseSilhouette.jsx";
import { AnimatedCount } from "./AnimatedCount.jsx";
import { catalogImgSrc } from "./HoseImage.jsx";
import { SHAPE_LABELS } from "../lib/enrichHose.js";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

const APPLICATIONS = [
  { key: "all",      label: "All",             sub: "Every shape",          icon: Layers3,   match: () => true },
  { key: "heater",   label: "Heater & bypass", sub: "0.4″ – 1.2″",          icon: Flame,     match: (r) => r.sizeBand === "bypass" || (r.sizeBand && r.sizeBand.startsWith("heater")) },
  { key: "rad",      label: "Radiator",        sub: "1.2″ – 1.9″",          icon: Snowflake, match: (r) => r.sizeBand === "radiator-small" || r.sizeBand === "radiator-mid" },
  { key: "hd",       label: "Heavy-duty",      sub: "1.9″+",                icon: Shield,    match: (r) => r.sizeBand === "radiator-large" || r.sizeBand === "radiator-xl" },
  { key: "branched", label: "Branched / T",    sub: "Bypass · Y · cross",   icon: GitFork,   match: (r) => r.hoseType === "branched" },
];

/**
 * @param {{
 *   allRows: any[],
 *   allHoses: any[],
 *   pageMap: Array<{ page: number, rows: number[], count: number }>,
 *   selectedRows: Set<number>,
 *   selectedSilhouettes: Set<string>,
 *   onToggleSilhouette: (sil: string) => void,
 *   onTogglePage: (rows: number[]) => void,
 *   onClearAll: () => void,
 *   onShowResults: () => void,
 *   resultCount: number,
 * }} props
 */
export function ShapeBrowser({ allRows, allHoses, pageMap, selectedRows, selectedSilhouettes, onToggleSilhouette, onTogglePage, onClearAll, onShowResults, resultCount }) {
  const [app, setApp] = useState("all");
  const [showCatalog, setShowCatalog] = useState(false);
  const activeApp = APPLICATIONS.find((a) => a.key === app) || APPLICATIONS[0];

  const appCounts = useMemo(() => {
    const acc = {};
    APPLICATIONS.forEach((a) => { acc[a.key] = 0; });
    for (const h of allHoses) {
      const r = { sizeBand: h.sizeBand, hoseType: h.hoseType };
      APPLICATIONS.forEach((a) => { if (a.match(r)) acc[a.key]++; });
    }
    return acc;
  }, [allHoses]);

  const shapeBuckets = useMemo(() => {
    const m = {};
    for (const h of allHoses) {
      if (!activeApp.match({ sizeBand: h.sizeBand, hoseType: h.hoseType })) continue;
      const sil = h.silhouette || "sweep";
      if (!m[sil]) m[sil] = { silhouette: sil, label: SHAPE_LABELS[sil] || sil, count: 0, rows: new Set() };
      m[sil].count++;
      m[sil].rows.add(h.rowNo);
    }
    return Object.values(m)
      .map((b) => ({ ...b, rows: Array.from(b.rows) }))
      .sort((a, b) => b.count - a.count);
  }, [allHoses, activeApp]);

  const filteredPageMap = useMemo(() => {
    if (app === "all") return pageMap;
    const allowedRows = new Set();
    for (const h of allHoses) {
      if (activeApp.match({ sizeBand: h.sizeBand, hoseType: h.hoseType })) allowedRows.add(h.rowNo);
    }
    return pageMap.filter((p) => p.rows.some((r) => allowedRows.has(r)));
  }, [pageMap, app, allHoses, activeApp]);

  const anySelection = selectedSilhouettes.size > 0 || selectedRows.size > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-6 overflow-hidden rounded-[32px] border border-white/10 backdrop-blur-xl"
      style={{
        background:
          "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.10), transparent 60%)," +
          "radial-gradient(28rem 10rem at 100% 0%, rgba(217,70,239,0.08), transparent 60%)," +
          "linear-gradient(180deg, rgba(20,20,28,0.7), rgba(10,10,15,0.7))",
        boxShadow:
          "0 24px 80px -28px rgba(139,92,246,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-60`} />

      <div className="flex flex-wrap items-end justify-between gap-3 p-6 pb-3 sm:p-7 sm:pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
            <Layers3 className="h-3 w-3" />
            Browse by shape
          </div>
          <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white">
            Pick the routing that looks right.
          </h3>
          <p className="mt-1 max-w-md text-sm text-zinc-400">
            Choose an application, then tap a shape family. No measurements required.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {anySelection && (
            <Button
              variant="ghost"
              onClick={onClearAll}
              className="h-9 rounded-2xl px-3 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              Clear selection
            </Button>
          )}
          <Button
            onClick={onShowResults}
            disabled={!anySelection}
            className={`h-9 rounded-2xl px-4 text-sm transition ${
              !anySelection
                ? "border border-white/10 bg-white/[0.04] text-zinc-400"
                : `border-0 bg-gradient-to-r ${ACCENT} text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.55)] hover:shadow-[0_14px_40px_-8px_rgba(217,70,239,0.65)]`
            }`}
          >
            Show <span className="mx-1 tabular"><AnimatedCount value={resultCount} /></span>
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-6 sm:px-7">
        <div className="flex flex-wrap gap-2">
          {APPLICATIONS.map((a) => {
            const active = app === a.key;
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => setApp(a.key)}
                className={`group relative inline-flex items-center gap-2 rounded-2xl border px-3 py-2 transition ${
                  active
                    ? "border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.55)]"
                    : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-violet-400/25 hover:bg-white/[0.07]"
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-xl border ${
                  active
                    ? "border-violet-300/40 bg-violet-500/20 text-violet-100"
                    : "border-white/10 bg-white/[0.04] text-zinc-400 group-hover:text-violet-200"
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-left">
                  <span className="block text-sm font-medium leading-none">{a.label}</span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.16em] text-zinc-400">{a.sub}</span>
                </span>
                <span className={`ml-1 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular ${
                  active ? "bg-white/15 text-white" : "bg-white/[0.06] text-zinc-400"
                }`}>
                  {appCounts[a.key].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 sm:p-7">
        <AnimatePresence mode="popLayout">
          {shapeBuckets.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-zinc-400"
            >
              No shapes in this category. Try another application.
            </motion.div>
          ) : (
            <motion.div
              key={app}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {shapeBuckets.map((b, i) => {
                const active = selectedSilhouettes.has(b.silhouette);
                return (
                  <motion.button
                    key={b.silhouette}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.025 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => onToggleSilhouette(b.silhouette)}
                    className={`group relative overflow-hidden rounded-[24px] border p-4 text-left transition-[border-color,background-color,box-shadow] duration-300 ${
                      active
                        ? "border-violet-400/45 bg-gradient-to-br from-violet-500/12 to-fuchsia-500/8 shadow-[0_18px_50px_-22px_rgba(139,92,246,0.55)]"
                        : "border-white/10 bg-white/[0.03] hover:border-violet-400/30 hover:bg-white/[0.06] hover:shadow-[0_18px_50px_-22px_rgba(139,92,246,0.45)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={`shapeActive-${app}`}
                        className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${ACCENT}`}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                      />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold capitalize text-white">{b.label}</div>
                      {active && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 380, damping: 22 }}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.7)]`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </motion.span>
                      )}
                    </div>
                    <div className={`mt-3 h-20 transition-colors duration-300 ${
                      active ? "text-violet-100" : "text-violet-300 group-hover:text-violet-200"
                    }`}>
                      <HoseSilhouette type={b.silhouette} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                      <span>{b.rows.length} row{b.rows.length === 1 ? "" : "s"}</span>
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 tabular text-violet-200">
                        {b.count.toLocaleString()} hoses
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filteredPageMap.length > 0 && (
        <div className="border-t border-white/5 px-6 pb-6 pt-4 sm:px-7 sm:pb-7">
          <button
            type="button"
            onClick={() => setShowCatalog((s) => !s)}
            className="inline-flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {showCatalog ? "Hide" : "Show"} source catalog pages
            <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular text-zinc-300">
              {filteredPageMap.length}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCatalog ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {showCatalog && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
                  {filteredPageMap.map((page) => {
                    const active = page.rows.some((rowNo) => selectedRows.has(rowNo));
                    return (
                      <button
                        key={page.page}
                        type="button"
                        onClick={() => onTogglePage(page.rows)}
                        className={`group overflow-hidden rounded-2xl border text-left transition ${
                          active
                            ? "border-violet-400/45 ring-2 ring-violet-500/25"
                            : "border-white/10 hover:border-violet-400/30"
                        }`}
                      >
                        <img
                          src={catalogImgSrc(page.page)}
                          alt={`Catalog page ${page.page}`}
                          loading="lazy"
                          className="aspect-[3/4] w-full object-cover object-top transition group-hover:opacity-90"
                        />
                        <div className="px-2 py-1.5 text-[10px] tabular text-zinc-400 group-hover:text-zinc-200">
                          <span className="font-semibold text-white">P. {page.page}</span>
                          <span className="text-zinc-400"> · {page.count}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
