// Hose detail modal — hero header, visual tiles, specs grid, action row
// (shortlist / compare / find similar / view 360°), gap explainer, and
// three suggestion sections (pair co-occurrence, similar by proximity).
// Receives everything it needs as props; no direct context reads beyond
// the unit toggle and the ROLE labels.

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Bookmark, Check, GitCompare, ArrowRight, ArrowUpDown,
  Ruler, Layers3, BookOpen, SlidersHorizontal, ExternalLink, ChevronRight,
} from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnit, useFmtDim, Dim } from "../context/unit.jsx";
import { gatesUrl, gates360Url } from "../lib/gatesUrls.js";
import { MatchBadge, Viewer360Icon } from "./primitives.jsx";
import { HoseSilhouette } from "./HoseSilhouette.jsx";
import { ImageTile } from "./HoseImage.jsx";
import { GapExplainer } from "./GapExplainer.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

const SIZE_BAND_LABELS = {
  "bypass":         "Bypass / micro (< 0.4\")",
  "heater-small":   "Heater — small (0.4–0.64\")",
  "heater-mid":     "Heater — mid (0.65–0.89\")",
  "heater-large":   "Heater — large (0.9–1.19\")",
  "radiator-small": "Radiator — small (1.2–1.49\")",
  "radiator-mid":   "Radiator — mid (1.5–1.89\")",
  "radiator-large": "Radiator — large (1.9–2.49\")",
  "radiator-xl":    "Radiator — XL (≥ 2.5\")",
};

/**
 * @param {{
 *   hose: any,
 *   onClose: () => void,
 *   suggestions: any[],
 *   onSelect: (h: any) => void,
 *   onShowRow: (rowNo: number) => void,
 *   onFindSimilar?: (h: any) => void,
 *   rowCount?: number,
 *   rowMeta?: { familyLabel?: string } | null,
 *   shortlist: Set<string>,
 *   toggleShortlist: (partNo: string) => void,
 *   compare: string[],
 *   toggleCompare: (partNo: string) => void,
 *   pairSuggestions?: Array<{ hose: any, count: number }>,
 *   onDisablePairing?: () => void,
 * }} props
 */
export function DetailModal({
  hose, onClose, suggestions, onSelect, onShowRow, onFindSimilar,
  rowCount, rowMeta,
  shortlist, toggleShortlist, compare, toggleCompare,
  pairSuggestions = [], onDisablePairing,
}) {
  const [activeImg, setActiveImg] = useState(0);
  const unitMode = useUnit();
  const fmtDim = useFmtDim();
  if (!hose) return null;
  const inShortlist = shortlist.has(hose.partNo);
  const inCompare = compare.includes(hose.partNo);

  const stats = [
    { icon: Ruler,             label: "End sizes (I.D.)",   value: fmtDim(hose.hoseId, unitMode), mono: true },
    { icon: ArrowUpDown,       label: "Centerline length",  value: fmtDim(hose.length, unitMode), mono: true },
    { icon: Layers3,           label: "End count",          value: hose.endCount, mono: true },
    { icon: GitCompare,        label: "Type",               value: <span className="capitalize">{hose.hoseType}</span> },
    { icon: BookOpen,          label: "Shape family",       value: rowMeta?.familyLabel || `${hose.visualFamily} · row ${hose.rowNo}` },
    { icon: SlidersHorizontal, label: "Size band",          value: SIZE_BAND_LABELS[hose.sizeBand] || hose.sizeBand },
    { icon: Bookmark,          label: "Catalog page",       value: hose.catalogPage || "—", mono: true },
  ];

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-5xl">
      <div
        className="relative overflow-hidden rounded-t-[32px] border-b border-white/5 px-6 pt-7 pb-6 sm:px-8 sm:pt-8"
        style={{
          background:
            "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.18), transparent 60%)," +
            "radial-gradient(32rem 12rem at 100% 0%, rgba(217,70,239,0.14), transparent 60%)," +
            "linear-gradient(180deg, rgba(20,20,28,0.6), rgba(9,9,11,0))",
        }}
      >
        <DialogHeader>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
                <Sparkles className="h-3 w-3" />
                Gates molded coolant hose
              </div>
              <DialogTitle className="mt-1.5 text-4xl font-semibold tracking-[-0.02em] text-white tabular sm:text-5xl">
                {hose.partNo}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DialogDescription className="m-0 text-sm text-zinc-300">{hose.visualFamily}</DialogDescription>
                <MatchBadge quality={hose._matchQuality} />
              </div>
            </div>
            <div className="hidden h-20 w-40 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-violet-200 sm:flex">
              <HoseSilhouette type={hose.silhouette} />
            </div>
          </div>
        </DialogHeader>
      </div>

      <div className="grid gap-6 px-6 pb-6 pt-5 sm:px-8 sm:pb-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Visual</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {hose.images.map((mode, i) => (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`overflow-hidden rounded-3xl text-left transition ${
                  activeImg === i
                    ? "ring-2 ring-violet-500/60 ring-offset-2 ring-offset-zinc-950"
                    : "ring-0 hover:ring-1 hover:ring-violet-400/30"
                }`}
              >
                <ImageTile
                  label={mode === "catalog" ? "Catalog page" : "Hose silhouette"}
                  mode={mode}
                  partNo={hose.partNo}
                  silhouette={hose.silhouette}
                  catalogPage={hose.catalogPage}
                />
              </button>
            ))}
          </div>
          {hose.catalogPage && (
            <p className="text-center text-xs text-zinc-600">Images from Gates catalog page {hose.catalogPage}.</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Specifications</div>
          <div className="grid grid-cols-2 gap-2">
            {stats.map(({ icon: Icon, label, value, mono }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-violet-400/25 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  <Icon className="h-3 w-3 text-violet-300/70" />
                  {label}
                </div>
                <div className={`mt-1 text-sm font-semibold text-white ${mono ? "tabular" : ""}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              onClick={() => toggleShortlist(hose.partNo)}
              className={`h-11 rounded-2xl transition ${
                inShortlist
                  ? `border-0 bg-gradient-to-r ${ACCENT} text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.55)] hover:shadow-[0_14px_40px_-8px_rgba(217,70,239,0.65)]`
                  : "border border-white/10 bg-white/[0.04] text-zinc-100 hover:border-violet-400/30 hover:bg-white/[0.08]"
              }`}
            >
              <Bookmark className={`mr-2 h-4 w-4 ${inShortlist ? "fill-current" : ""}`} />
              {inShortlist ? "Saved" : "Shortlist"}
            </Button>
            <Button
              onClick={() => toggleCompare(hose.partNo)}
              className={`h-11 rounded-2xl transition ${
                inCompare
                  ? `border-0 bg-gradient-to-r ${ACCENT} text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.55)] hover:shadow-[0_14px_40px_-8px_rgba(217,70,239,0.65)]`
                  : "border border-white/10 bg-white/[0.04] text-zinc-100 hover:border-violet-400/30 hover:bg-white/[0.08]"
              }`}
            >
              {inCompare ? <Check className="mr-2 h-4 w-4" /> : <GitCompare className="mr-2 h-4 w-4" />}
              {inCompare ? "Comparing" : "Compare"}
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="ghost"
              onClick={() => {
                onShowRow(hose.rowNo);
                onClose();
              }}
              className="group w-full rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-zinc-300 transition hover:border-violet-400/25 hover:bg-white/[0.07] hover:text-white"
            >
              See all <span className="mx-1 font-semibold text-zinc-100 tabular">{rowCount || "?"}</span> in row
              <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => onFindSimilar?.(hose)}
              className="group w-full rounded-2xl border border-violet-400/20 bg-violet-500/8 text-sm text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-500/15 hover:text-white"
            >
              <Sparkles className="mr-1.5 h-4 w-4" /> Find similar
              <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={gates360Url(hose.partNo)}
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-gradient-to-r ${ACCENT} text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.5)] transition hover:shadow-[0_12px_30px_-8px_rgba(217,70,239,0.6)]`}
            >
              <Viewer360Icon className="h-4 w-4" />
              View 360° on Gates
              <ExternalLink className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </a>
            <a
              href={gatesUrl(hose.partNo)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-zinc-200 transition hover:border-violet-400/30 hover:bg-white/[0.08] hover:text-white"
            >
              Search gates.com
              <ExternalLink className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </a>
          </div>

          {hose._gap && (hose._gap.idHasTgt || hose._gap.lenHasTgt) && (
            <div
              className="relative overflow-hidden rounded-2xl border border-violet-400/20 p-4"
              style={{
                background:
                  "linear-gradient(160deg, rgba(139,92,246,0.10), rgba(217,70,239,0.04))",
              }}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-50`} />
              <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Match vs your spec</div>
              <div className="mt-2"><GapExplainer gap={hose._gap} /></div>
            </div>
          )}

          {hose.tags?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Tags</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hose.tags.map((t) => (
                  <Badge
                    key={t}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {pairSuggestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Often added alongside this hose</div>
                {onDisablePairing && (
                  <button
                    type="button"
                    onClick={onDisablePairing}
                    className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 transition hover:text-red-300"
                    title="All pairing data is local. Clicking turns this feature off."
                  >
                    disable
                  </button>
                )}
              </div>
              <div className="mt-2 grid gap-2">
                {pairSuggestions.map(({ hose: p, count }) => (
                  <button
                    key={p.partNo}
                    type="button"
                    onClick={() => onSelect(p)}
                    className="group flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-3 text-left transition hover:border-violet-400/40 hover:bg-violet-500/10"
                  >
                    <div className="h-10 w-16 shrink-0 text-violet-300 transition group-hover:text-violet-200">
                      <HoseSilhouette type={p.silhouette} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white tabular">{p.partNo}</div>
                      <div className="truncate text-xs text-zinc-400">{p.visualFamily}</div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-zinc-400 tabular">
                      <div><Dim value={p.hoseId} /></div>
                      <div><Dim value={p.length} /></div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-violet-300/70">{count}× paired</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Similar hoses</div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-violet-300/70">By proximity</span>
              </div>
              <div className="mt-2 grid gap-2">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s.partNo}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i }}
                    onClick={() => onSelect(s)}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-violet-400/30 hover:bg-white/[0.07] hover:shadow-[0_12px_30px_-12px_rgba(139,92,246,0.5)]"
                  >
                    <div className="h-10 w-16 shrink-0 text-violet-300 transition group-hover:text-violet-200">
                      <HoseSilhouette type={s.silhouette} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white tabular">{s.partNo}</div>
                      <div className="truncate text-xs text-zinc-400">{s.visualFamily}</div>
                    </div>
                    <div className="text-right text-xs text-zinc-400 tabular">
                      <div><Dim value={s.hoseId} /></div>
                      <div><Dim value={s.length} /></div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
}
