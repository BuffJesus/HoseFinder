// Three one-tap tolerance presets: Exact / Flexible / Wide. Replaces the
// cognitive load of "what does ±0.06 mean?" with words builders actually
// think in. Lives directly in the filter panel, always visible — the
// numeric sliders stay behind the "More filters" disclosure for power
// users who want fine control.
//
// The active preset deselects (→ "Custom") if the user manually moves
// either slider, so the two controls never contradict each other.

import React, { useMemo } from "react";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/** @type {ReadonlyArray<{ key: string, label: string, hint: string, idTol: number, lenTol: number }>} */
const PRESETS = [
  { key: "exact",    label: "Exact",    hint: "tight fit",       idTol: 0.02, lenTol: 0.5 },
  { key: "flexible", label: "Flexible", hint: "close enough",    idTol: 0.06, lenTol: 2.0 },
  { key: "wide",     label: "Wide",     hint: "show me options", idTol: 0.15, lenTol: 5.0 },
];

/**
 * @param {{
 *   idTol: number,
 *   lenTol: number,
 *   onApply: (idTol: number, lenTol: number) => void,
 * }} props
 */
export function TolerancePresets({ idTol, lenTol, onApply }) {
  const activeKey = useMemo(() => {
    for (const p of PRESETS) {
      if (Math.abs(p.idTol - idTol) < 0.005 && Math.abs(p.lenTol - lenTol) < 0.05) return p.key;
    }
    return null;
  }, [idTol, lenTol]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Tolerance</span>
      <div className="flex items-center gap-1.5">
        {PRESETS.map((p) => {
          const active = activeKey === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onApply(p.idTol, p.lenTol)}
              title={p.hint}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
                active
                  ? `bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.55)]`
                  : "border border-white/10 bg-white/[0.04] text-zinc-300 hover:border-violet-400/25 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        {activeKey === null && (
          <span className="text-[10px] text-zinc-400 italic">Custom</span>
        )}
      </div>
    </div>
  );
}
