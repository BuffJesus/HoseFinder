// Empty-state surface shown when the current filter combination returns
// zero results. Rather than a dead end, shows:
//   - Which axis is the blocker (diameter or length)
//   - The closest hose along each axis
//   - Relaxation paths the user can one-tap apply
//   - Top-4 nearest neighbours for the single most-promising relaxation

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand, SearchX, BookOpen, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnit, useFmtDim, Dim } from "../context/unit.jsx";
import { MM_PER_IN } from "../lib/units.js";
import { scoreAndFilter } from "../lib/filter.js";
import { HoseSilhouette } from "./HoseSilhouette.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

// Each relaxation is one targeted concession. Ordered so the most conservative
// path is tried first; the UI surfaces all paths that produce any results.
const RELAXATIONS = [
  { idTol: 0.08, lenTol: 3,   label: "Slight loosen",       tone: "safe"   },
  { idTol: 0.10, lenTol: 4,   label: "Moderate loosen",     tone: "safe"   },
  { idTol: 0.06, lenTol: 99,  label: "Drop length filter",  tone: "trade"  },
  { idTol: 0.20, lenTol: 99,  label: "Wide net",            tone: "wide"   },
];

function relaxationHint(r, mode) {
  const idStr = mode === "mm"
    ? `±${(r.idTol * MM_PER_IN).toFixed(1)} mm`
    : `±${r.idTol.toFixed(2)}"`;
  if (r.lenTol >= 99 && r.idTol >= 0.15) return `ID ${idStr} · any length`;
  if (r.lenTol >= 99) return "Any route length";
  const lenStr = mode === "mm"
    ? `±${(r.lenTol * MM_PER_IN).toFixed(0)} mm`
    : `±${r.lenTol.toFixed(0)}"`;
  return `ID ${idStr} · length ${lenStr}`;
}

function relaxedHits(allHoses, targetId1, targetId2, targetLen, r) {
  return allHoses
    .map((h) => scoreAndFilter(h, {
      targetId1, targetId2, targetLen,
      idTol: r.idTol, lenTol: r.lenTol,
      hoseTypeFilter: "all", sizeBandFilter: "all",
      endCountFilter: "all", flow: "all", search: "",
    }))
    .filter(Boolean);
}

/**
 * @param {{
 *   targetId1: string, targetId2: string, targetLen: string,
 *   allHoses: any[],
 *   onApply: (tols: { idTol: number, lenTol: number }) => void,
 *   onSelect: (hose: any) => void,
 *   onShowGuide?: () => void,
 *   onClearLength?: () => void,
 *   onClearId?: () => void,
 * }} props
 */
export function SmartEmptyState({ targetId1, targetId2, targetLen, allHoses, onApply, onSelect, onShowGuide, onClearLength, onClearId }) {
  const unitMode = useUnit();
  const fmtDim = useFmtDim();

  const paths = useMemo(() => {
    if (!allHoses.length) return [];
    return RELAXATIONS
      .map((r) => {
        const hits = relaxedHits(allHoses, targetId1, targetId2, targetLen, r);
        hits.sort((a, b) => b._score - a._score);
        return { ...r, hint: relaxationHint(r, unitMode), count: hits.length, top: hits.slice(0, 4) };
      })
      .filter((p) => p.count > 0);
  }, [allHoses, targetId1, targetId2, targetLen, unitMode]);

  const diagnosis = useMemo(() => {
    if (!allHoses.length) return null;
    const idOnly = relaxedHits(allHoses, targetId1, targetId2, targetLen, { idTol: 0.5, lenTol: 0.5 });
    const lenOnly = relaxedHits(allHoses, targetId1, targetId2, targetLen, { idTol: 0.02, lenTol: 99 });

    const t1 = parseFloat(targetId1);
    const tLen = parseFloat(targetLen);
    let nearestById = null;
    let nearestByLen = null;
    if (!isNaN(t1)) {
      let best = Infinity;
      for (const h of allHoses) {
        if (!h.endSizes.length) continue;
        const d = Math.min(...h.endSizes.map((s) => Math.abs(s - t1)));
        if (d < best) { best = d; nearestById = { hose: h, delta: d }; }
      }
    }
    if (!isNaN(tLen)) {
      let best = Infinity;
      for (const h of allHoses) {
        const d = Math.abs(h.length - tLen);
        if (d < best) { best = d; nearestByLen = { hose: h, delta: d }; }
      }
    }

    let blocker = null;
    if (nearestById && nearestByLen) {
      const idMul = nearestById.delta / 0.06;
      const lenMul = nearestByLen.delta / 2.0;
      blocker = idMul > lenMul ? "id" : "length";
    } else if (nearestById) blocker = "id";
    else if (nearestByLen) blocker = "length";

    return { nearestById, nearestByLen, blocker, idOnly: idOnly.length, lenOnly: lenOnly.length };
  }, [allHoses, targetId1, targetId2, targetLen]);

  const best = paths[0];
  const noPath = paths.length === 0;
  const hasLen = targetLen !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[32px] border border-amber-400/20"
      style={{
        background:
          "linear-gradient(160deg, rgba(245,158,11,0.10), rgba(217,70,239,0.05) 55%, rgba(20,20,26,0.95))",
        boxShadow: "0 24px 80px -28px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/15 text-amber-300">
              <SearchX className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/80">Nothing matches yet</div>
              <div className="text-2xl font-semibold tracking-tight text-white">Tighten the spec or loosen below.</div>
            </div>
          </div>

          {diagnosis && (diagnosis.nearestById || diagnosis.nearestByLen) && (
            <div className="mt-5 grid gap-2 text-sm text-zinc-300 md:grid-cols-2">
              {diagnosis.nearestById && (
                <div className={`rounded-2xl border px-3 py-2 ${diagnosis.blocker === "id" ? "border-amber-400/30 bg-amber-500/8" : "border-white/10 bg-white/[0.04]"}`}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Closest diameter</div>
                  <div className="mt-0.5 tabular">
                    <span className="font-semibold text-white"><Dim value={diagnosis.nearestById.hose.hoseId} /></span>
                    <span className="text-zinc-500"> · </span>
                    <span className={diagnosis.blocker === "id" ? "text-amber-200" : "text-zinc-400"}>
                      {fmtDim(diagnosis.nearestById.delta, unitMode, 2)} off
                    </span>
                  </div>
                </div>
              )}
              {diagnosis.nearestByLen && (
                <div className={`rounded-2xl border px-3 py-2 ${diagnosis.blocker === "length" ? "border-amber-400/30 bg-amber-500/8" : "border-white/10 bg-white/[0.04]"}`}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Closest length</div>
                  <div className="mt-0.5 tabular">
                    <span className="font-semibold text-white"><Dim value={diagnosis.nearestByLen.hose.length} /></span>
                    <span className="text-zinc-500"> · </span>
                    <span className={diagnosis.blocker === "length" ? "text-amber-200" : "text-zinc-400"}>
                      {fmtDim(diagnosis.nearestByLen.delta, unitMode, 1)} off
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {paths.length > 0 ? (
            <div className="mt-6">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Try one of these</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {paths.map((p, i) => (
                  <motion.button
                    key={p.label}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (p.lenTol >= 99 && hasLen && p.idTol === 0.06) {
                        onClearLength?.();
                      } else {
                        onApply({ idTol: p.idTol, lenTol: p.lenTol });
                      }
                    }}
                    className={`group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition ${
                      i === 0
                        ? "border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.55)]"
                        : "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-violet-400/30 hover:bg-white/[0.07]"
                    }`}
                  >
                    {i === 0
                      ? <Sparkles className="h-3.5 w-3.5 text-violet-200" />
                      : <Wand className="h-3.5 w-3.5 text-zinc-400 group-hover:text-violet-300" />}
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="text-[11px] tabular text-zinc-500">{p.hint}</span>
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular text-violet-200">
                      {p.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
            {hasLen && (
              <button
                type="button"
                onClick={onClearLength}
                className="inline-flex items-center gap-1 transition hover:text-white"
              >
                Drop length filter <ArrowRight className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onClearId}
              className="inline-flex items-center gap-1 transition hover:text-white"
            >
              Reset diameter <ArrowRight className="h-3 w-3" />
            </button>
            {onShowGuide && (
              <button
                type="button"
                onClick={onShowGuide}
                className="inline-flex items-center gap-1 transition hover:text-white"
              >
                Re-check measurements <BookOpen className="h-3 w-3" />
              </button>
            )}
          </div>

          {noPath && (
            <p className="mt-5 max-w-md text-sm text-zinc-400">
              Nothing in the catalog is close to this spec across any axis. Re-check your measurements — even a tight relax brings up no results.
            </p>
          )}
        </div>

        {best && (
          <div className="lg:w-[26rem]">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Closest if you {best.label.toLowerCase()}</div>
              <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[11px] tabular text-violet-200">
                {best.count} matches
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {best.top.map((h, i) => (
                <motion.button
                  key={h.partNo}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -3 }}
                  onClick={() => onSelect(h)}
                  className="group rounded-2xl border border-white/10 bg-black/30 p-3 text-left transition hover:border-violet-400/40 hover:bg-white/[0.06] hover:shadow-[0_12px_30px_-12px_rgba(139,92,246,0.5)]"
                >
                  <div className="h-12 text-violet-300 transition group-hover:text-violet-200">
                    <HoseSilhouette type={h.silhouette} />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white tabular">{h.partNo}</div>
                  <div className="text-[11px] text-zinc-400 tabular"><Dim value={h.hoseId} /> · <Dim value={h.length} /></div>
                </motion.button>
              ))}
            </div>
            <Button
              onClick={() => onApply({ idTol: best.idTol, lenTol: best.lenTol })}
              className={`mt-3 w-full rounded-2xl bg-gradient-to-r ${ACCENT} text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.55)] transition hover:shadow-[0_14px_40px_-8px_rgba(217,70,239,0.65)]`}
            >
              Show all {best.count} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
