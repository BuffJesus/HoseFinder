// Filter panel body. Search → three dimension inputs → disclosed "More
// filters" with tolerance sliders + size-band / end-count selects → clear.
// All strings of canonical inches flow through `<NaturalDimInput>`.

import React from "react";
import { SlidersHorizontal, Search, Ruler, Sparkles, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnit } from "../context/unit.jsx";
import { MM_PER_IN } from "../lib/units.js";
import { AnimatedCount } from "./AnimatedCount.jsx";
import { MmHint } from "./primitives.jsx";
import { MeasurementHint } from "./MeasurementHint.jsx";
import { NaturalDimInput } from "./NaturalDimInput.jsx";
import { CommonSizesPicker } from "./CommonSizesPicker.jsx";

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
 *   search: string, setSearch: (v: string) => void,
 *   targetId1: string, setTargetId1: (v: string) => void,
 *   targetId2: string, setTargetId2: (v: string) => void,
 *   targetLen: string, setTargetLen: (v: string) => void,
 *   liveDiameterMatches: number, liveLengthMatches: number,
 *   showAdvancedFilters: boolean, setShowAdvancedFilters: (fn: (prev: boolean) => boolean) => void,
 *   idTol: number[], setIdTol: (v: number[]) => void,
 *   lenTol: number[], setLenTol: (v: number[]) => void,
 *   sizeBandFilter: string, setSizeBandFilter: (v: string) => void,
 *   endCountFilter: string, setEndCountFilter: (v: string) => void,
 *   clearAllFilters: () => void,
 *   onOpenPhotoMeasure?: () => void,
 * }} props
 */
export function FilterPanelContent({
  search, setSearch,
  targetId1, setTargetId1, targetId2, setTargetId2, targetLen, setTargetLen,
  liveDiameterMatches, liveLengthMatches,
  showAdvancedFilters, setShowAdvancedFilters,
  idTol, setIdTol, lenTol, setLenTol,
  sizeBandFilter, setSizeBandFilter, endCountFilter, setEndCountFilter,
  clearAllFilters,
  onOpenPhotoMeasure,
}) {
  const unitMode = useUnit();
  const idPlace1 = unitMode === "mm" ? "e.g. 38" : "e.g. 1.50";
  const idPlace2 = unitMode === "mm" ? "e.g. 32" : "e.g. 1.25";
  const lenPlace = unitMode === "mm" ? "e.g. 470" : "e.g. 18.5";
  const unitLabel = unitMode === "mm" ? "mm" : "inches";
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ACCENT} text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.55)]`}>
          <SlidersHorizontal className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Refine results</div>
          <p className="mt-0.5 text-xs leading-5 text-zinc-400">
            Enter measurements. Tolerance controls how close a match can be.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="part-search-input" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition peer-focus:text-violet-300" aria-hidden="true" />
          <Input id="part-search-input" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Part number, size, type..."
            className="peer min-h-11 rounded-2xl border-white/10 bg-black/20 pl-10 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div
        className="relative space-y-3 overflow-hidden rounded-3xl border border-violet-400/20 p-4"
        style={{
          background:
            "linear-gradient(160deg, rgba(139,92,246,0.10), rgba(217,70,239,0.04) 60%, rgba(255,255,255,0.02))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-60`} />
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_12px_-2px_rgba(139,92,246,0.6)]`}>
            <Ruler className="h-3 w-3" />
          </span>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">Your measurements</div>
          {onOpenPhotoMeasure && (
            <button
              type="button"
              onClick={onOpenPhotoMeasure}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
              title="Measure from a photo"
            >
              <Sparkles className="h-3 w-3" /> Photo
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="dim-id1" className="text-xs text-zinc-400">End 1 diameter (I.D., {unitLabel})</label>
            <MeasurementHint type="id" />
          </div>
          <NaturalDimInput
            id="dim-id1"
            value={targetId1}
            onChange={setTargetId1}
            placeholder={idPlace1}
            historyKey="id1"
          />
          <CommonSizesPicker value={targetId1} onPick={setTargetId1} />
          {targetId1 !== "" && (
            <div className="flex items-center gap-1.5 text-xs text-violet-300">
              <AnimatedCount value={liveDiameterMatches} /> hose{liveDiameterMatches === 1 ? "" : "s"} match this diameter set
              {unitMode === "in" && <MmHint value={targetId1} className="ml-auto text-[10px]" />}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="dim-id2" className="text-xs text-zinc-400">End 2 diameter — reducers only (optional)</label>
            <MeasurementHint type="id" />
          </div>
          <NaturalDimInput
            id="dim-id2"
            value={targetId2}
            onChange={setTargetId2}
            placeholder={idPlace2}
            historyKey="id2"
          />
          <CommonSizesPicker value={targetId2} onPick={setTargetId2} />
          {targetId2 !== "" && (
            <div className="flex items-center gap-1.5 text-xs text-violet-300">
              <AnimatedCount value={liveDiameterMatches} /> hose{liveDiameterMatches === 1 ? "" : "s"} match both end sizes
              {unitMode === "in" && <MmHint value={targetId2} className="ml-auto text-[10px]" />}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="dim-len" className="text-xs text-zinc-400">Centerline length ({unitLabel})</label>
            <MeasurementHint type="length" />
          </div>
          <NaturalDimInput
            id="dim-len"
            value={targetLen}
            onChange={setTargetLen}
            placeholder={lenPlace}
            historyKey="len"
          />
          {targetLen !== "" && (
            <div className="text-xs text-violet-300">
              <AnimatedCount value={liveLengthMatches} /> hose{liveLengthMatches === 1 ? "" : "s"} fit this routed length
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <button
          type="button"
          onClick={() => setShowAdvancedFilters((prev) => !prev)}
          className="flex min-h-11 w-full items-center justify-between text-left"
        >
          <div>
            <div className="text-sm font-medium text-white">More filters</div>
            <div className="text-xs text-zinc-500">Tolerance and category controls</div>
          </div>
          <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${showAdvancedFilters ? "rotate-180" : ""}`} />
        </button>
        {showAdvancedFilters ? (
          <div className="mt-4 space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Diameter tolerance</label>
                  <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${ACCENT} px-2.5 py-0.5 text-[11px] font-semibold tabular text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.5)]`}>
                    ±{unitMode === "mm" ? (idTol[0] * MM_PER_IN).toFixed(1) : idTol[0].toFixed(2)}<span className="opacity-70">{unitMode === "mm" ? " mm" : "\""}</span>
                  </span>
                </div>
                <Slider min={0.01} max={0.25} step={0.01} value={idTol} onValueChange={setIdTol} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Length tolerance</label>
                  <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${ACCENT} px-2.5 py-0.5 text-[11px] font-semibold tabular text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.5)]`}>
                    {lenTol[0] >= 99 ? "Any" : <>±{unitMode === "mm" ? (lenTol[0] * MM_PER_IN).toFixed(0) : lenTol[0].toFixed(1)}<span className="opacity-70">{unitMode === "mm" ? " mm" : "\""}</span></>}
                  </span>
                </div>
                <Slider min={0.5} max={6} step={0.5} value={lenTol[0] >= 99 ? [6] : lenTol} onValueChange={setLenTol} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Size band</label>
                <Select value={sizeBandFilter} onValueChange={setSizeBandFilter}>
                  <SelectTrigger className="min-h-11 rounded-2xl border-white/10 bg-black/20 text-zinc-100">
                    <SelectValue placeholder="All sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sizes</SelectItem>
                    {Object.entries(SIZE_BAND_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Number of ends</label>
                <Select value={endCountFilter} onValueChange={setEndCountFilter}>
                  <SelectTrigger className="min-h-11 rounded-2xl border-white/10 bg-black/20 text-zinc-100">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any end count</SelectItem>
                    <SelectItem value="1">1 end (same-size)</SelectItem>
                    <SelectItem value="2">2 ends (reducer)</SelectItem>
                    <SelectItem value="3">3 ends (branched)</SelectItem>
                    <SelectItem value="4">4 ends (branched)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Button
        variant="ghost"
        className="min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] text-xs text-zinc-400 transition hover:border-violet-400/30 hover:bg-white/[0.07] hover:text-white"
        onClick={clearAllFilters}
      >
        <X className="mr-2 h-3.5 w-3.5" /> Clear all filters
      </Button>
    </div>
  );
}
