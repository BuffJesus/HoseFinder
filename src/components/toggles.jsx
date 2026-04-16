// Two radio-pill toggles living in the top bar: unit system (in/mm) and
// display language (EN/ES). Both share the same shape so the TopBar reads
// as a consistent preference strip.

import React from "react";
import { motion } from "framer-motion";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";
const LOCALE_LABELS = { en: "EN", es: "ES" };

/** @param {{ mode: "in"|"mm", onChange: (m: "in"|"mm") => void, className?: string }} props */
export function UnitToggle({ mode, onChange, className = "" }) {
  const opts = [{ k: "in", label: "in" }, { k: "mm", label: "mm" }];
  return (
    <div
      role="radiogroup"
      aria-label="Measurement units"
      className={`relative inline-flex rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {opts.map((o) => {
        const active = mode === o.k;
        return (
          <button
            key={o.k}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.k === "in" ? "Inches" : "Millimetres"}
            onClick={() => onChange(o.k)}
            className={`relative z-10 inline-flex h-7 min-h-0 items-center justify-center px-3 transition ${
              active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {active && (
              <motion.span
                layoutId="unitTogglePill"
                className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-r ${ACCENT} shadow-[0_4px_14px_-2px_rgba(139,92,246,0.5)]`}
                transition={{ type: "spring", stiffness: 480, damping: 32 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** @param {{ locale: "en"|"es", onChange: (l: "en"|"es") => void, className?: string }} props */
export function LocaleToggle({ locale, onChange, className = "" }) {
  const opts = [{ k: "en", label: LOCALE_LABELS.en }, { k: "es", label: LOCALE_LABELS.es }];
  return (
    <div
      role="radiogroup"
      aria-label="Display language"
      className={`relative inline-flex rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {opts.map((o) => {
        const active = locale === o.k;
        return (
          <button
            key={o.k}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.k === "en" ? "English" : "Español"}
            onClick={() => onChange(o.k)}
            className={`relative z-10 inline-flex h-7 min-h-0 items-center justify-center px-2.5 transition ${
              active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {active && (
              <motion.span
                layoutId="localeTogglePill"
                className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-r ${ACCENT} shadow-[0_4px_14px_-2px_rgba(139,92,246,0.5)]`}
                transition={{ type: "spring", stiffness: 480, damping: 32 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
