// Common-application preset cards shown above the wizard. Each card is a
// one-tap populate — fills the wizard state with typical specs for
// well-known engine combos.

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/** @param {{ icon: string }} props */
export function PresetIcon({ icon }) {
  const common = "h-5 w-5";
  if (icon === "heater") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <rect x="4" y="6" width="16" height="12" rx="3" fill="currentColor" opacity="0.18" />
        <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "bottle") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M10 4h4M10.5 4v4L7 18a2 2 0 0 0 1.8 2h6.4A2 2 0 0 0 17 18l-3.5-10V4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "branch") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M4 14h16M12 14V5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} aria-hidden>
      <path d="M4 13c2-4 5-6 8-6s5 2 8 6M6 16h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * @typedef {{
 *   label: string, sub: string, why?: string,
 *   targetId1: string, targetId2: string, targetLen: string,
 *   lenTol: number, idTol: number,
 *   flow: string, icon: string,
 * }} Preset
 *
 * @param {{
 *   presets: Preset[],
 *   onApply: (preset: Preset) => void,
 *   onDismiss: () => void,
 * }} props
 */
export function PresetsStrip({ presets, onApply, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-8 overflow-hidden rounded-[32px] border border-white/10 backdrop-blur-xl"
      style={{
        background:
          "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.12), transparent 60%)," +
          "radial-gradient(28rem 10rem at 100% 0%, rgba(217,70,239,0.10), transparent 60%)," +
          "linear-gradient(180deg, rgba(20,20,28,0.7), rgba(10,10,15,0.7))",
        boxShadow:
          "0 24px 80px -28px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-70`} />
      <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-3 sm:p-7 sm:pb-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
            <Sparkles className="h-3 w-3" />
            Preset starts
          </div>
          <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white">Common applications</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Tap a typical combo to populate the wizard, then refine.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onDismiss}
          className="h-9 rounded-2xl px-3 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          Dismiss
        </Button>
      </div>
      <div className="grid gap-3 p-6 pt-3 sm:grid-cols-2 sm:p-7 sm:pt-3 xl:grid-cols-4">
        {presets.map((preset, i) => {
          const sizeText = [preset.targetId1, preset.targetId2].filter(Boolean).join(`" × `);
          return (
            <motion.button
              key={`${preset.label}-${preset.sub}`}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onApply(preset)}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-4 text-left transition-[border-color,background-color,box-shadow] duration-300 hover:border-violet-400/30 hover:bg-white/[0.06] hover:shadow-[0_18px_50px_-22px_rgba(139,92,246,0.55)]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{preset.label}</div>
                  <div className="text-[11px] text-zinc-400">{preset.sub}</div>
                </div>
                <div className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-2 text-violet-200 transition group-hover:border-violet-400/45 group-hover:bg-violet-500/20">
                  <PresetIcon icon={preset.icon} />
                </div>
              </div>
              <div className="mt-4 grid gap-1.5 text-[11px] text-zinc-300">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-1.5">
                  <span className="text-zinc-400">Type</span>
                  <span className="capitalize text-white">{preset.flow}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-1.5">
                  <span className="text-zinc-400">End sizes</span>
                  <span className="text-white tabular">{sizeText}"</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-1.5">
                  <span className="text-zinc-400">Length</span>
                  <span className="text-white tabular">{preset.targetLen}" ±{preset.lenTol}"</span>
                </div>
              </div>
              {preset.why && (
                <p className="mt-3 text-[11px] leading-5 text-zinc-400">
                  {preset.why}
                </p>
              )}
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-violet-300 opacity-0 transition-opacity group-hover:opacity-100">
                Apply preset <ArrowRight className="h-3 w-3" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
