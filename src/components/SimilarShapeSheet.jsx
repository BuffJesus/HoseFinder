// Ranked-by-shape-similarity sheet, opened from any card's "Find similar"
// action. Shows the two strongest similarity reasons inline per result so
// the ranking is always explainable in one glance. Optional I.D. refiner
// lets the user say "same shape, but 1.75" ends."

import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUnit, Dim } from "../context/unit.jsx";
import { MM_PER_IN } from "../lib/units.js";
import { parseNaturalSize } from "../lib/naturalSize.js";
import { findSimilarHoses } from "../lib/similarity.js";
import { HoseSilhouette } from "./HoseSilhouette.jsx";
import { NaturalDimInput } from "./NaturalDimInput.jsx";

/**
 * @param {{
 *   open: boolean,
 *   target: any,
 *   allHoses: any[],
 *   onClose: () => void,
 *   onSelect: (h: any) => void,
 * }} props
 */
export function SimilarShapeSheet({ open, target, allHoses, onClose, onSelect }) {
  const [idFilter, setIdFilter] = useState("");
  useEffect(() => { if (open) setIdFilter(""); }, [open, target?.partNo]);

  const unitMode = useUnit();
  const base = useMemo(() => findSimilarHoses(target, allHoses, { limit: 60 }), [target, allHoses]);
  const filtered = useMemo(() => {
    if (!idFilter) return base.slice(0, 12);
    const n = parseNaturalSize(idFilter, unitMode);
    if (n == null) return base.slice(0, 12);
    const inches = unitMode === "mm" ? n / MM_PER_IN : n;
    return base.filter((b) => b.hose.endSizes.some((s) => Math.abs(s - inches) <= 0.06)).slice(0, 12);
  }, [base, idFilter, unitMode]);

  if (!open || !target) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-2xl">
        <div className="px-5 pb-5 pt-6">
          <DialogHeader>
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Similar shape</div>
            <DialogTitle className="mt-1 flex items-baseline gap-2 text-xl font-semibold text-white">
              <span className="tabular">{target.partNo}</span>
              <span className="text-sm font-normal text-zinc-400">· {target.visualFamily}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Ranked by silhouette family, curvature, step ratio, length class and size band.
              Each result shows the two strongest reasons it matched.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Refine by I.D.</label>
            <NaturalDimInput
              value={idFilter}
              onChange={setIdFilter}
              placeholder={unitMode === "mm" ? "e.g. 38" : "e.g. 1.5"}
              className="flex-1"
            />
            {idFilter && (
              <button
                type="button"
                onClick={() => setIdFilter("")}
                aria-label="Clear I.D. filter"
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 text-zinc-400 transition hover:border-violet-400/30 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-400">
              No similar shapes match that I.D. Try clearing the refinement.
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {filtered.map(({ hose, score, reasons }) => (
                <li key={hose.partNo}>
                  <button
                    type="button"
                    onClick={() => { onSelect(hose); onClose(); }}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                  >
                    <div className="h-10 w-16 shrink-0 text-violet-300 transition group-hover:text-violet-200">
                      <HoseSilhouette type={hose.silhouette} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold tabular text-white">{hose.partNo}</span>
                        <span className="truncate text-xs text-zinc-400">{hose.visualFamily}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {reasons.slice(0, 2).map((r) => (
                          <span key={r.label} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-200">
                            {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-zinc-400 tabular">
                      <div><Dim value={hose.hoseId} /></div>
                      <div><Dim value={hose.length} /></div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-violet-300/70">
                        {Math.round(score * 100)}% match
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
