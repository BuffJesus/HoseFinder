// The step-bearing wizard block: eyebrow + animated step title, then the
// three-step chain (FlowCards → WizardSizesStep → WizardLengthStep) with
// summary strips in between so completed steps collapse. Pulls in the
// ShapeBrowser branch when `shapeMode` is active.
//
// All step choreography happens inside this component now; the parent
// hands over setters, reads, and one `onAdvanceToResults` callback for
// the final step. Keeps CoolantHoseFinder free of wizard wiring.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search } from "lucide-react";
import { FlowCards } from "./FlowCards.jsx";
import { WizardSizesStep } from "./WizardSizesStep.jsx";
import { WizardLengthStep } from "./WizardLengthStep.jsx";
import { WizardSummaryStrip } from "./wizard-cards.jsx";
import { ShapeBrowser } from "./ShapeBrowser.jsx";

/**
 * @param {{
 *   t: (key: string) => string,
 *   step: number | "results",
 *   setStep: (s: number | "results") => void,
 *   flow: string,
 *   setFlow: (f: string) => void,
 *   flowSummary: string,
 *   targetId1: string, setTargetId1: (v: string) => void,
 *   targetId2: string, setTargetId2: (v: string) => void,
 *   targetLen: string, setTargetLen: (v: string) => void,
 *   needsSecondDiameter: boolean,
 *   hasRequiredDimensions: boolean,
 *   liveDiameterMatches: number,
 *   liveLengthMatches: number,
 *   lenTol: number[],
 *   setLenTol: (v: number[]) => void,
 *   sizeSummary: string,
 *   lengthSummary: string,
 *   unitMode: "in" | "mm",
 *   allHoses: any[],
 *   allRows: any[],
 *   pageMap: any[],
 *   selectedRows: Set<number>,
 *   silhouettes: Set<string>,
 *   setSilhouettes: (fn: (prev: Set<string>) => Set<string>) => void,
 *   setSelectedRows: (s: Set<number>) => void,
 *   toggleShapePage: (rows: number[]) => void,
 *   shapeMode: boolean,
 *   setShapeMode: (v: boolean) => void,
 *   filteredCount: number,
 *   onShowPresets?: () => void,
 *   onPartLookup?: (hose: any) => void,
 *   allHosesForLookup?: any[],
 * }} props
 */
export function WizardSection({
  t,
  step, setStep,
  flow, setFlow, flowSummary,
  targetId1, setTargetId1,
  targetId2, setTargetId2,
  targetLen, setTargetLen,
  needsSecondDiameter, hasRequiredDimensions,
  liveDiameterMatches, liveLengthMatches,
  lenTol, setLenTol,
  sizeSummary, lengthSummary,
  unitMode, allHoses,
  allRows, pageMap, selectedRows, silhouettes,
  setSilhouettes, setSelectedRows, toggleShapePage,
  shapeMode, setShapeMode,
  filteredCount,
  onShowPresets, onPartLookup, allHosesForLookup,
}) {
  const titleForStep = () => {
    if (step === 1) return t("wizard.step1Prompt");
    if (step === 2) return t("wizard.step2Prompt");
    if (step === 3) return t("wizard.step3Prompt");
    return t("wizard.resultsPrompt");
  };

  return (
    <section className="mt-10">
      <div className="mb-5 min-w-0">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {t("wizard.sectionEyebrow")}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={`step-${step}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1.5 text-2xl font-semibold tracking-tight text-white"
          >
            {titleForStep()}
          </motion.h2>
        </AnimatePresence>
      </div>

      {(step === 1 || flow === "all") ? (
        <>
          <FlowCards
            flow={flow}
            onSelect={(key) => {
              setFlow(key);
              setStep(2);
            }}
          />
          {onShowPresets && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <button type="button" onClick={onShowPresets} className="transition hover:text-violet-200">
                <Sparkles className="mr-1 inline h-3 w-3 text-violet-300/70" />
                Start from a common engine preset
              </button>
              {onPartLookup && allHosesForLookup && allHosesForLookup.length > 0 && (
                <button type="button" onClick={() => {
                  const raw = window.prompt("Enter a 5-digit Gates part number:");
                  if (!raw) return;
                  const partNo = raw.replace(/\D/g, "").slice(0, 5);
                  const hose = allHosesForLookup.find((h) => h.partNo === partNo);
                  if (hose) onPartLookup(hose);
                }} className="transition hover:text-violet-200">
                  <Search className="mr-1 inline h-3 w-3 text-violet-300/70" />
                  Look up a part number
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <WizardSummaryStrip label="Step 1" value={flowSummary} onClick={() => setStep(1)} />
      )}

      {flow !== "all" && (
        <>
          {step === 2 ? (
            <WizardSizesStep
              targetId1={targetId1}
              setTargetId1={setTargetId1}
              targetId2={targetId2}
              setTargetId2={setTargetId2}
              needsSecondDiameter={needsSecondDiameter}
              hasRequiredDimensions={hasRequiredDimensions}
              liveDiameterMatches={liveDiameterMatches}
              unitMode={unitMode}
              allHoses={allHoses}
              t={t}
              onAdvance={() => setStep(3)}
            />
          ) : (
            <div className="mt-6">
              <WizardSummaryStrip label="Step 2" value={sizeSummary} onClick={() => setStep(2)} />
            </div>
          )}

          {hasRequiredDimensions && step !== 2 && (
            step === 3 ? (
              <WizardLengthStep
                targetLen={targetLen}
                setTargetLen={setTargetLen}
                lenTol={lenTol}
                setLenTol={setLenTol}
                liveLengthMatches={liveLengthMatches}
                unitMode={unitMode}
                t={t}
                onAdvance={(skip) => {
                  if (skip) setLenTol([99]);
                  setStep("results");
                }}
              />
            ) : (
              <div className="mt-6">
                <WizardSummaryStrip label="Step 3" value={lengthSummary || "Length: Not set"} onClick={() => setStep(3)} />
              </div>
            )
          )}
        </>
      )}

      {shapeMode && pageMap.length > 0 && (
        <ShapeBrowser
          allRows={allRows}
          allHoses={allHoses}
          pageMap={pageMap}
          selectedRows={selectedRows}
          selectedSilhouettes={silhouettes}
          onToggleSilhouette={(sil) => {
            setSilhouettes((prev) => {
              const next = new Set(prev);
              if (next.has(sil)) next.delete(sil);
              else next.add(sil);
              return next;
            });
          }}
          onTogglePage={toggleShapePage}
          onClearAll={() => {
            setSelectedRows(new Set());
            setSilhouettes(new Set());
          }}
          onShowResults={() => {
            setShapeMode(false);
            setStep("results");
          }}
          resultCount={filteredCount}
        />
      )}
    </section>
  );
}
