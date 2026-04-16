// A hover/focus-triggered inline SVG hint next to each dimension input.
// Shows *where* to measure, not just what the field wants — the ruler
// vector beats a paragraph of copy ("measure the metal neck O.D.").

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler } from "lucide-react";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

function IdMeasurementSVG() {
  return (
    <svg viewBox="0 0 220 120" className="h-auto w-full" aria-hidden>
      <rect x="46" y="44" width="128" height="30" rx="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)" />
      <rect x="64" y="34" width="92" height="50" rx="16" fill="rgba(167,139,250,0.18)" stroke="rgba(196,181,253,0.8)" />
      <path d="M54 26 V92 M166 26 V92" stroke="rgba(244,244,245,0.8)" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M54 18 H166" stroke="rgba(244,244,245,0.9)" strokeWidth="2" />
      <path d="M54 18 L61 12 M54 18 L61 24 M166 18 L159 12 M166 18 L159 24" stroke="rgba(244,244,245,0.9)" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 32 V88 H54 M188 32 V88 H166" stroke="rgba(139,92,246,0.9)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="110" y="14" textAnchor="middle" fill="rgba(244,244,245,0.92)" fontSize="11" fontWeight="700">Measure neck O.D.</text>
      <text x="110" y="106" textAnchor="middle" fill="rgba(161,161,170,0.92)" fontSize="10">Order the hose I.D. to match it</text>
    </svg>
  );
}

function LengthMeasurementSVG() {
  return (
    <svg viewBox="0 0 220 120" className="h-auto w-full" aria-hidden>
      <rect x="18" y="28" width="18" height="42" rx="8" fill="rgba(255,255,255,0.1)" />
      <rect x="184" y="42" width="18" height="42" rx="8" fill="rgba(255,255,255,0.1)" />
      <path d="M27 50 C60 22, 110 24, 136 58 S178 88, 193 64" fill="none" stroke="rgba(139,92,246,0.95)" strokeWidth="8" strokeLinecap="round" />
      <path d="M27 50 C60 22, 110 24, 136 58 S178 88, 193 64" fill="none" stroke="rgba(244,244,245,0.95)" strokeWidth="2.5" strokeDasharray="5 5" />
      <path d="M38 84 L182 84" stroke="rgba(244,244,245,0.24)" strokeWidth="2" />
      <path d="M38 84 L46 80 M38 84 L46 88 M182 84 L174 80 M182 84 L174 88" stroke="rgba(244,244,245,0.24)" strokeWidth="2" strokeLinecap="round" />
      <text x="110" y="16" textAnchor="middle" fill="rgba(244,244,245,0.92)" fontSize="11" fontWeight="700">Follow the routed path</text>
      <text x="110" y="104" textAnchor="middle" fill="rgba(161,161,170,0.92)" fontSize="10">Straight-line distance comes up short</text>
    </svg>
  );
}

/** @param {{ type: "id"|"length" }} props */
export function MeasurementHint({ type }) {
  const [open, setOpen] = useState(false);
  const title = type === "length" ? "How to measure route length" : "How to measure hose diameter";
  const description = type === "length"
    ? "Trace the actual route with wire or tape — straight-line undershoots."
    : "Measure the metal neck outside diameter; the hose I.D. should match.";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={title}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="group inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200"
      >
        <Ruler className="h-3 w-3 transition group-hover:scale-110" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-9 z-30 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-[24px] border border-white/10 backdrop-blur-xl shadow-[0_24px_80px_-28px_rgba(139,92,246,0.55)] md:left-auto md:right-0"
            style={{
              background:
                "radial-gradient(28rem 10rem at 0% 0%, rgba(139,92,246,0.16), transparent 60%)," +
                "linear-gradient(160deg, rgba(20,20,28,0.95), rgba(10,10,16,0.95))",
            }}
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-70`} />
            <div className="p-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_12px_-2px_rgba(139,92,246,0.55)]`}>
                  <Ruler className="h-3 w-3" />
                </span>
                <div className="text-[10px] uppercase tracking-[0.22em] text-violet-200">{title}</div>
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                {type === "length" ? <LengthMeasurementSVG /> : <IdMeasurementSVG />}
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-400">{description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
