// Canonical size chips. Disclosure + grid of the diameters builders see most
// on real engines. Values stored and pasted as inch strings; `<Dim>` picks
// up whatever unit the user is currently viewing.
//
// When a `validValues` Set is passed, chips not in the set render dimmed
// with `aria-disabled="true"` and don't fire `onPick`. This lets the End 2
// picker show only diameters that actually pair with the End 1 value in the
// catalogue — same idea in reverse when the user starts with End 2.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Dim } from "../context/unit.jsx";
import { isPairingValid } from "../lib/endPairings.js";

const COMMON_IDS = [
  "0.375", "0.5", "0.625", "0.75", "0.875",
  "1.0", "1.25", "1.5", "1.625", "1.75", "1.875",
  "2.0", "2.25", "2.5", "3.0",
];

/**
 * @param {{
 *   value: string,
 *   onPick: (v: string) => void,
 *   validValues?: Set<number> | null,
 *   constraintLabel?: string,
 * }} props
 */
export function CommonSizesPicker({ value, onPick, validValues = null, constraintLabel }) {
  const [open, setOpen] = useState(false);
  const anyValid = !validValues
    || COMMON_IDS.some((v) => isPairingValid(validValues, v));
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 transition hover:text-violet-200"
      >
        Common sizes
        {constraintLabel && <span className="text-[10px] text-violet-300/80">· {constraintLabel}</span>}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-8">
              {COMMON_IDS.map((v) => {
                const active = value === v || parseFloat(value) === parseFloat(v);
                const enabled = isPairingValid(validValues, v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { if (enabled) onPick(v); }}
                    aria-disabled={!enabled}
                    title={!enabled ? "No catalog hose pairs this with the other end" : undefined}
                    className={`rounded-xl border px-1.5 py-1 text-[11px] tabular transition ${
                      active
                        ? `border-violet-400/40 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.55)]`
                        : enabled
                          ? "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-violet-400/25 hover:bg-white/[0.07] hover:text-white"
                          : "border-white/5 bg-white/[0.01] text-zinc-600 cursor-not-allowed opacity-40"
                    }`}
                  >
                    <Dim value={v} />
                  </button>
                );
              })}
            </div>
            {!anyValid && validValues && (
              <div className="mt-2 rounded-xl border border-amber-400/25 bg-amber-500/8 px-3 py-2 text-[11px] text-amber-200">
                No catalog hose pairs with the other end at any of the common sizes.
                Clear the other end to see all options.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
