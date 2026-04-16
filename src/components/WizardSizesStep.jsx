// Step 2 of the guided wizard: End 1 diameter (always) + End 2 diameter
// (reducers & branched only). Uses NaturalDimInput so "1-1/2" / "38mm"
// parse cleanly, CommonSizesPicker for one-tap canonical sizes, and the
// pair-aware `validPairingsFor` so each picker hides sizes that don't
// actually pair with the other end in the catalogue.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCount } from "./AnimatedCount.jsx";
import { MeasurementHint } from "./MeasurementHint.jsx";
import { NaturalDimInput } from "./NaturalDimInput.jsx";
import { CommonSizesPicker } from "./CommonSizesPicker.jsx";
import { MmHint } from "./primitives.jsx";
import { WizardStepCard } from "./wizard-cards.jsx";
import { validPairingsFor } from "../lib/endPairings.js";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   targetId1: string, setTargetId1: (v: string) => void,
 *   targetId2: string, setTargetId2: (v: string) => void,
 *   needsSecondDiameter: boolean,
 *   hasRequiredDimensions: boolean,
 *   liveDiameterMatches: number,
 *   unitMode: "in" | "mm",
 *   allHoses: any[],
 *   t: (key: string) => string,
 *   onAdvance: () => void,
 * }} props
 */
export function WizardSizesStep({
  targetId1, setTargetId1,
  targetId2, setTargetId2,
  needsSecondDiameter,
  hasRequiredDimensions,
  liveDiameterMatches,
  unitMode,
  allHoses,
  t,
  onAdvance,
}) {
  const unitsLabel = unitMode === "mm" ? "mm" : "inches";
  const end1ValidSet = needsSecondDiameter && targetId2
    ? validPairingsFor(allHoses, targetId2) : null;
  const end2ValidSet = targetId1 ? validPairingsFor(allHoses, targetId1) : null;

  return (
    <WizardStepCard
      step={2}
      title="Your sizes"
      subtitle="Enter the neck diameters you measured. Results start narrowing as soon as you type."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="wiz-dim-id1" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              End 1 diameter (I.D., {unitsLabel})
            </label>
            <MeasurementHint type="id" />
          </div>
          <NaturalDimInput
            id="wiz-dim-id1"
            value={targetId1}
            onChange={setTargetId1}
            placeholder={unitMode === "mm" ? "e.g. 38" : "e.g. 1.50"}
            historyKey="id1"
          />
          <CommonSizesPicker
            value={targetId1}
            onPick={setTargetId1}
            validValues={end1ValidSet}
            constraintLabel={needsSecondDiameter && targetId2 ? `pairs with ${targetId2}"` : ""}
          />
          <AnimatePresence>
            {targetId1 !== "" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-1.5 text-xs text-violet-300"
              >
                <Sparkles className="h-3 w-3" />
                <AnimatedCount value={liveDiameterMatches} /> hose{liveDiameterMatches === 1 ? "" : "s"} match this diameter set
                <MmHint value={targetId1} className="ml-auto text-[10px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {needsSecondDiameter && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="wiz-dim-id2" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                End 2 diameter (I.D., {unitsLabel})
              </label>
              <MeasurementHint type="id" />
            </div>
            <NaturalDimInput
              id="wiz-dim-id2"
              value={targetId2}
              onChange={setTargetId2}
              placeholder={unitMode === "mm" ? "e.g. 32" : "e.g. 1.25"}
              historyKey="id2"
            />
            <CommonSizesPicker
              value={targetId2}
              onPick={setTargetId2}
              validValues={end2ValidSet}
              constraintLabel={targetId1 ? `pairs with ${targetId1}"` : ""}
            />
            <AnimatePresence>
              {targetId2 !== "" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1.5 text-xs text-violet-300"
                >
                  <Sparkles className="h-3 w-3" />
                  <AnimatedCount value={liveDiameterMatches} /> hose{liveDiameterMatches === 1 ? "" : "s"} match both end sizes
                  <MmHint value={targetId2} className="ml-auto text-[10px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Button
            onClick={onAdvance}
            disabled={!hasRequiredDimensions}
            className={`group h-11 rounded-2xl px-5 transition ${
              hasRequiredDimensions
                ? `border-0 bg-gradient-to-r ${ACCENT} text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.55)] hover:shadow-[0_14px_40px_-8px_rgba(217,70,239,0.65)]`
                : "border border-white/10 bg-white/[0.04] text-zinc-400 cursor-not-allowed"
            }`}
          >
            {t("common.continue")}
            <ChevronRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
          </Button>
          <button
            type="button"
            onClick={onAdvance}
            disabled={!hasRequiredDimensions}
            className="text-xs text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Skip to length
          </button>
        </div>
      </div>
    </WizardStepCard>
  );
}
