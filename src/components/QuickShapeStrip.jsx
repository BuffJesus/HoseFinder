// "Wire method" shortcut: six tappable shape tiles that map to the
// existing curvature buckets. Builders who shaped a piece of wire to
// approximate their routing can pick the tile that looks like their wire
// instead of typing measurements. Each tile carries a live count of how
// many catalog hoses match that shape given whatever other filters are
// active.
//
// Under the hood this is a thin visual skin over the `curvature` filter
// state: picking "S-bend" toggles the `compound` curvature key in the
// Set; picking "Y-branch" also flips flow to "branched". Everything
// else the matcher already handles — we're just offering a more
// immediate entry point than the CurvatureChips strip.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { CURVATURE_BY_SIL } from "../lib/shapeBuckets.js";
import { HoseSilhouette } from "./HoseSilhouette.jsx";
import { useLocale } from "../context/i18n.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @typedef {{
 *   key: string,
 *   label: string,
 *   hint: string,
 *   silhouette: string,
 *   curvatureKey: string | null,
 *   flow?: "single" | "reducer" | "branched",
 * }} ShapeTile
 */

/** @type {ReadonlyArray<ShapeTile>} */
const TILES = [
  { key: "straight", label: "Straight-ish", hint: "wire stays almost flat",             silhouette: "gentle",     curvatureKey: "straight" },
  { key: "gentle",   label: "Gentle curve", hint: "one wide sweep, no hard corners",    silhouette: "wideArc",    curvatureKey: "sweep"    },
  { key: "elbow",    label: "Tight elbow",  hint: "one sharp turn, short each side",    silhouette: "shortElbow", curvatureKey: "elbow"    },
  { key: "s-bend",   label: "S-bend",       hint: "two opposing turns in a row",        silhouette: "compound",   curvatureKey: "compound" },
  { key: "z-bend",   label: "Z-bend",       hint: "two parallel steps, offset ends",    silhouette: "Zturn",      curvatureKey: "z"        },
  { key: "j-hook",   label: "J-hook",       hint: "tight turn, then a long straight",   silhouette: "hook",       curvatureKey: "hook"     },
  { key: "y-branch", label: "Y-branch",     hint: "three ends — bypass tee",            silhouette: "branchY",    curvatureKey: "branch", flow: "branched" },
];

/**
 * @param {{
 *   candidates: any[],
 *   curvature: Set<string>,
 *   setCurvature: (s: Set<string>) => void,
 *   flow: string,
 *   setFlow: (f: string) => void,
 *   onOpenBendBuilder?: () => void,
 *   onOpenWirePhoto?: () => void,
 * }} props
 */
export function QuickShapeStrip({ candidates, curvature, setCurvature, flow, setFlow, onOpenBendBuilder, onOpenWirePhoto }) {
  const { t } = useLocale();
  const counts = useMemo(() => {
    const m = /** @type {Record<string, number>} */ ({});
    for (const h of candidates) {
      const group = CURVATURE_BY_SIL[h.silhouette];
      if (!group) continue;
      m[group] = (m[group] || 0) + 1;
    }
    return m;
  }, [candidates]);

  const handlePick = (tile) => {
    const isActive = tile.curvatureKey && curvature.has(tile.curvatureKey)
      && (!tile.flow || flow === tile.flow);
    if (isActive) {
      // Untoggle: clear curvature + flow back to "all" if the tile owned it.
      const next = new Set(curvature);
      if (tile.curvatureKey) next.delete(tile.curvatureKey);
      setCurvature(next);
      if (tile.flow && flow === tile.flow) setFlow("all");
      return;
    }
    // Activate: set curvature to just this group (exclusive for the quick
    // picker — builders usually know one shape, not a combination).
    setCurvature(tile.curvatureKey ? new Set([tile.curvatureKey]) : new Set());
    if (tile.flow) setFlow(tile.flow);
  };

  return (
    <section
      aria-labelledby="quick-shape-heading"
      className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10 p-5"
      style={{
        background:
          "radial-gradient(36rem 12rem at 0% 0%, rgba(139,92,246,0.10), transparent 60%)," +
          "linear-gradient(180deg, rgba(20,20,26,0.72), rgba(10,10,15,0.72))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-50`} />
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">{t("wireMethod.eyebrow")}</div>
          <h3 id="quick-shape-heading" className="mt-0.5 text-base font-semibold tracking-tight text-white">
            {t("wireMethod.title")}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            {t("wireMethod.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onOpenBendBuilder && (
            <button
              type="button"
              onClick={onOpenBendBuilder}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-400/30 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-violet-400/50 hover:bg-violet-500/25"
            >
              {t("wireMethod.sketchButton")}
              <span aria-hidden>→</span>
            </button>
          )}
          {onOpenWirePhoto && (
            <button
              type="button"
              onClick={onOpenWirePhoto}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-400/30 hover:bg-white/[0.08] hover:text-white"
            >
              {t("wireMethod.photoButton")}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {TILES.map((tile) => {
          const count = counts[tile.curvatureKey] || 0;
          const active = tile.curvatureKey && curvature.has(tile.curvatureKey)
            && (!tile.flow || flow === tile.flow);
          return (
            <motion.button
              key={tile.key}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePick(tile)}
              aria-pressed={active}
              disabled={!active && count === 0}
              title={tile.hint}
              className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                active
                  ? "border-violet-400/45 bg-violet-500/15 shadow-[0_12px_40px_-16px_rgba(139,92,246,0.65)]"
                  : count === 0
                    ? "border-white/5 bg-white/[0.01] text-zinc-600 cursor-not-allowed opacity-45"
                    : "border-white/10 bg-white/[0.04] hover:border-violet-400/30 hover:bg-white/[0.07]"
              }`}
            >
              <div className={`h-10 ${active ? "text-violet-200" : "text-violet-300/80"}`}>
                <HoseSilhouette type={tile.silhouette} />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className={`text-xs font-semibold tracking-tight ${active ? "text-white" : "text-zinc-200"}`}>
                  {tile.label}
                </span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular ${
                  active ? "bg-white/15 text-white" : "bg-white/[0.06] text-zinc-400"
                }`}>
                  {count}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-400 line-clamp-1">{tile.hint}</div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
