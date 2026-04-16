// "Recently viewed" horizontal scroll strip shown above the results when
// no filters are active. Clicking any card re-opens its detail modal.
// Local-only — never shared via URL or CSV export.

import React from "react";
import { motion } from "framer-motion";
import { HoseSilhouette } from "./HoseSilhouette.jsx";
import { Dim } from "../context/unit.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/** @param {{ hoses: any[], onSelect: (h: any) => void }} props */
export function RecentlyViewedStrip({ hoses, onSelect }) {
  if (!hoses.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-5 overflow-hidden rounded-[28px] border border-white/10"
      style={{
        background:
          "radial-gradient(28rem 12rem at 0% 0%, rgba(139,92,246,0.14), transparent 60%)," +
          "linear-gradient(160deg, rgba(18,18,24,0.92), rgba(8,8,12,0.96))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-40`} />
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Recently viewed</div>
          <div className="mt-1 text-sm text-zinc-300">Jump back into recent candidates without rebuilding the search.</div>
        </div>
        <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-400 sm:inline-flex">
          Last <span className="mx-1 tabular text-white">{hoses.length}</span>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 pt-3 sm:px-5">
        {hoses.map((hose) => (
          <button
            key={hose.partNo}
            type="button"
            onClick={() => onSelect(hose)}
            className="group min-w-[220px] flex-shrink-0 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-violet-400/30 hover:bg-white/[0.06]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Part</div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-white tabular">{hose.partNo}</div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                Row {hose.rowNo}
              </div>
            </div>
            <div className="mt-3 h-14 text-violet-300/90 transition group-hover:text-violet-200">
              <HoseSilhouette type={hose.silhouette} polyline={hose.shape?.polyline} />
            </div>
            <div className="mt-3 line-clamp-1 text-sm text-zinc-300">{hose.visualFamily}</div>
            <div className="mt-1 text-xs text-zinc-400">
              <span className="tabular"><Dim value={hose.hoseId} /></span>
              <span className="mx-1.5 text-zinc-700">·</span>
              <span className="tabular"><Dim value={hose.length} /></span>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
