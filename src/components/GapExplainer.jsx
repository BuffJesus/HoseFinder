// Explain-as-you-go per-axis readout of how close a hose sits to the
// user's target. Shown in the detail modal alongside the match badge so
// "Close fit" expands into something actionable ("Length: 1.8" longer").

import React from "react";
import { Ruler, ArrowUpDown, Check } from "lucide-react";
import { useUnit, useFmtDim } from "../context/unit.jsx";

/** @param {{ gap: import("../lib/filter.js").Gap | null | undefined }} props */
export function GapExplainer({ gap }) {
  const unitMode = useUnit();
  const fmtDim = useFmtDim();
  if (!gap || (!gap.idHasTgt && !gap.lenHasTgt)) return null;
  const lines = [];
  if (gap.idHasTgt) {
    if (gap.idExact) {
      lines.push({ ok: true, icon: Ruler, label: "Diameter", value: "Exact match" });
    } else {
      lines.push({
        ok: false,
        icon: Ruler,
        label: "Diameter",
        value: fmtDim(gap.idDelta, unitMode, 2),
        suffix: gap.idDir,
      });
    }
  }
  if (gap.lenHasTgt) {
    if (gap.lenExact) {
      lines.push({ ok: true, icon: ArrowUpDown, label: "Length", value: "Exact match" });
    } else {
      lines.push({
        ok: false,
        icon: ArrowUpDown,
        label: "Length",
        value: fmtDim(gap.lenDelta, unitMode, 1),
        suffix: gap.lenDir,
      });
    }
  }
  return (
    <div className="space-y-1.5 text-xs">
      {lines.map((l) => {
        const Icon = l.icon;
        return (
          <div
            key={l.label}
            className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 ${
              l.ok
                ? "border-emerald-400/25 bg-emerald-500/8 text-emerald-200"
                : "border-white/10 bg-white/[0.04] text-zinc-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Icon className={`h-3 w-3 ${l.ok ? "text-emerald-300" : "text-zinc-400"}`} />
              <span className="text-zinc-400">{l.label}</span>
            </span>
            <span className="flex items-center gap-1.5 tabular">
              <span className="font-semibold text-white">{l.value}</span>
              {l.suffix && <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">{l.suffix}</span>}
              {l.ok && <Check className="h-3 w-3 text-emerald-300" strokeWidth={3} />}
            </span>
          </div>
        );
      })}
    </div>
  );
}
