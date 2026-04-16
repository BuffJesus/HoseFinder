// Step 3 of the guided wizard: a single length field + tolerance slider.
// The user can enter a centerline length or skip — skipping calls
// onAdvance(true), which the parent uses to slam the length tolerance to
// "any" before transitioning to results. Wrapped in WizardStepCard so the
// chrome matches the other steps.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AnimatedCount } from "./AnimatedCount.jsx";
import { MeasurementHint } from "./MeasurementHint.jsx";
import { NaturalDimInput } from "./NaturalDimInput.jsx";
import { WizardStepCard } from "./wizard-cards.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   targetLen: string,
 *   setTargetLen: (v: string) => void,
 *   lenTol: number[],
 *   setLenTol: (v: number[]) => void,
 *   liveLengthMatches: number,
 *   unitMode: "in" | "mm",
 *   t: (key: string) => string,
 *   onAdvance: (skipLength?: boolean) => void,
 * }} props
 */
export function WizardLengthStep({
  targetLen, setTargetLen,
  lenTol, setLenTol,
  liveLengthMatches,
  unitMode,
  t,
  onAdvance,
}) {
  return (
    <WizardStepCard
      step={3}
      title="Route length"
      subtitle="Add a centerline length if you have one, or skip and browse by size first."
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="wiz-dim-len" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Centerline length ({unitMode === "mm" ? "mm" : "inches"})
            </label>
            <MeasurementHint type="length" />
          </div>
          <NaturalDimInput
            id="wiz-dim-len"
            value={targetLen}
            onChange={setTargetLen}
            placeholder={unitMode === "mm" ? "e.g. 470" : "e.g. 18.5"}
            historyKey="len"
          />
          <AnimatePresence>
            {targetLen !== "" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-1.5 text-xs text-violet-300"
              >
                <Sparkles className="h-3 w-3" />
                <AnimatedCount value={liveLengthMatches} /> hose{liveLengthMatches === 1 ? "" : "s"} fit this routed length
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Length tolerance</label>
            <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${ACCENT} px-2.5 py-0.5 text-[11px] font-semibold tabular text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.5)]`}>
              {lenTol[0] >= 99 ? "Any" : <>±{lenTol[0].toFixed(1)}<span className="opacity-70">"</span></>}
            </span>
          </div>
          <Slider min={0.5} max={6} step={0.5} value={lenTol[0] >= 99 ? [6] : lenTol} onValueChange={setLenTol} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onAdvance(false)}
            className={`group h-11 rounded-2xl border-0 bg-gradient-to-r ${ACCENT} px-5 text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.55)] transition hover:shadow-[0_14px_40px_-8px_rgba(217,70,239,0.65)]`}
          >
            Show results
            <ChevronRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
          </Button>
          <button
            type="button"
            onClick={() => onAdvance(true)}
            className="text-xs text-zinc-400 transition hover:text-white"
          >
            {t("common.skipForNow")}
          </button>
        </div>
      </div>
    </WizardStepCard>
  );
}
