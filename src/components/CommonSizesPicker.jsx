// Canonical size chips. Disclosure + grid of the diameters builders see most
// on real engines. Values stored and pasted as inch strings; `<Dim>` picks
// up whatever unit the user is currently viewing.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Dim } from "../context/unit.jsx";

const COMMON_IDS = [
  "0.375", "0.5", "0.625", "0.75", "0.875",
  "1.0", "1.25", "1.5", "1.625", "1.75", "1.875",
  "2.0", "2.25", "2.5", "3.0",
];

/** @param {{ value: string, onPick: (v: string) => void }} props */
export function CommonSizesPicker({ value, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 transition hover:text-violet-200"
      >
        Common sizes
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
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onPick(v)}
                    className={`rounded-xl border px-1.5 py-1 text-[11px] tabular transition ${
                      active
                        ? `border-violet-400/40 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.55)]`
                        : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-violet-400/25 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <Dim value={v} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
