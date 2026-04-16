// Side-by-side comparison modal for 2–3 shortlisted hoses. Spec rows where
// every hose matches render muted; rows where any differ highlight violet
// so the differences pop without the reader scanning every value.

import React from "react";
import { GitCompare, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUnit, useFmtDim } from "../context/unit.jsx";
import { HoseSilhouette } from "./HoseSilhouette.jsx";
import { MatchBadge } from "./primitives.jsx";

// Kept in sync with the table in CoolantHoseFinder's enrichHose pipeline —
// human labels for each sizeBand key.
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
 *   open: boolean,
 *   onClose: () => void,
 *   hoses: any[],
 *   onRemove: (partNo: string) => void,
 *   onSelect: (h: any) => void,
 * }} props
 */
export function CompareModal({ open, onClose, hoses, onRemove, onSelect }) {
  const unitMode = useUnit();
  const fmtDim = useFmtDim();
  if (!open || hoses.length === 0) return null;

  const rows = [
    { label: "Part",         get: (h) => h.partNo,                                 mono: true,  hero: true },
    { label: "I.D.",         get: (h) => fmtDim(h.hoseId, unitMode),               mono: true },
    { label: "Length",       get: (h) => fmtDim(h.length, unitMode),               mono: true },
    { label: "Type",         get: (h) => h.hoseType,                               capitalize: true },
    { label: "End count",    get: (h) => String(h.endCount),                       mono: true },
    { label: "Size band",    get: (h) => SIZE_BAND_LABELS[h.sizeBand] || h.sizeBand },
    { label: "Shape family", get: (h) => h.visualFamily },
    { label: "Catalog page", get: (h) => String(h.catalogPage || "—"),             mono: true },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-5xl">
        <div
          className="relative overflow-hidden rounded-t-[32px] border-b border-white/5 px-6 pt-7 pb-5 sm:px-8"
          style={{
            background:
              "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.18), transparent 60%)," +
              "radial-gradient(32rem 12rem at 100% 0%, rgba(217,70,239,0.14), transparent 60%)," +
              "linear-gradient(180deg, rgba(20,20,28,0.6), rgba(9,9,11,0))",
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
              <GitCompare className="h-3 w-3" />
              Side-by-side
            </div>
            <DialogTitle className="mt-1.5 text-3xl font-semibold tracking-[-0.02em] text-white">
              Compare <span className="tabular text-violet-300">{hoses.length}</span> {hoses.length === 1 ? "hose" : "hoses"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Differences are highlighted in violet.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div className="grid gap-3" style={{ gridTemplateColumns: `120px repeat(${hoses.length}, minmax(0, 1fr))` }}>
            <div />
            {hoses.map((h) => (
              <div key={`head-${h.partNo}`} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <button
                  type="button"
                  onClick={() => onRemove(h.partNo)}
                  aria-label="Remove from comparison"
                  className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="h-16 text-violet-300">
                  <HoseSilhouette type={h.silhouette} />
                </div>
                <div className="mt-2 text-base font-semibold tabular tracking-tight text-white">{h.partNo}</div>
                <div className="truncate text-[11px] text-zinc-500">{h.visualFamily}</div>
                <div className="mt-2">
                  <MatchBadge quality={h._matchQuality} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1.5">
            {rows.filter((r) => !r.hero).map((r) => {
              const values = hoses.map((h) => r.get(h));
              const allSame = values.every((v) => v === values[0]);
              return (
                <div
                  key={r.label}
                  className={`grid items-center gap-3 rounded-2xl border px-3 py-2 ${
                    allSame
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-violet-400/25 bg-violet-500/[0.06]"
                  }`}
                  style={{ gridTemplateColumns: `120px repeat(${hoses.length}, minmax(0, 1fr))` }}
                >
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {!allSame && <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />}
                    {r.label}
                  </div>
                  {values.map((v, i) => (
                    <div
                      key={`${r.label}-${i}`}
                      className={`text-sm text-white ${r.mono ? "tabular" : ""} ${r.capitalize ? "capitalize" : ""}`}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `120px repeat(${hoses.length}, minmax(0, 1fr))` }}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Tags</div>
            {hoses.map((h) => (
              <div key={`tags-${h.partNo}`} className="flex flex-wrap gap-1.5">
                {h.tags.map((t) => (
                  <Badge key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                    {t}
                  </Badge>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">
              {(() => {
                const ids = hoses.map((h) => parseFloat(h.hoseId)).filter((n) => !isNaN(n));
                const lens = hoses.map((h) => h.length);
                const idRange = ids.length ? `${Math.min(...ids).toFixed(2)}″–${Math.max(...ids).toFixed(2)}″` : "—";
                const lenRange = `${Math.min(...lens).toFixed(1)}″–${Math.max(...lens).toFixed(1)}″`;
                return <>I.D. spread <span className="text-zinc-300 tabular">{idRange}</span> · Length spread <span className="text-zinc-300 tabular">{lenRange}</span></>;
              })()}
            </div>
            <div className="flex flex-wrap gap-2">
              {hoses.map((h) => (
                <Button
                  key={`open-${h.partNo}`}
                  variant="ghost"
                  onClick={() => onSelect(h)}
                  className="h-9 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs text-zinc-200 hover:border-violet-400/30 hover:bg-white/[0.08] hover:text-white"
                >
                  Open <span className="ml-1 tabular text-zinc-400">{h.partNo}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
