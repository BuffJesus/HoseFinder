// Four-state results surface under the sticky header:
//   1. Loading          — grid of HoseCardSkeleton
//   2. No input yet     — ResultsPlaceholder with CTAs
//   3. No matches       — "Did you mean …" fuzzy chips + SmartEmptyState
//   4. Matches present  — view-mode switcher (grid/list/compact) + Load more
//
// The parent owns all the state; this component just chooses which of
// the four paths to render and wires the handlers through.

import React from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dim } from "../context/unit.jsx";
import { HoseCard, HoseCardSkeleton } from "./HoseCard.jsx";
import { HoseListCard } from "./HoseListCard.jsx";
import { HoseCompactTable } from "./HoseCompactTable.jsx";
import { SmartEmptyState } from "./SmartEmptyState.jsx";
import { ResultsPlaceholder } from "./ResultsPlaceholder.jsx";

/**
 * @param {{
 *   loading: boolean,
 *   canShowResults: boolean,
 *   filtered: any[],
 *   paginated: any[],
 *   hasMore: boolean,
 *   fuzzyPartSuggestions: any[],
 *   viewMode: "grid" | "list" | "compact",
 *   dTargetId1: string, dTargetId2: string, dTargetLen: string,
 *   allHoses: any[],
 *   shortlist: Set<string>,
 *   toggleShortlist: (partNo: string) => void,
 *   rowCounts: Record<number, number>,
 *   onSelect: (h: any) => void,
 *   onLoadMore: () => void,
 *   onSearchByPart: (partNo: string) => void,
 *   onBrowseShapes: () => void,
 *   onApplyTolerances: (args: { idTol: number, lenTol: number }) => void,
 *   onShowRow: (rowNo: number) => void,
 *   onFindSimilar: (h: any) => void,
 *   onClearLength: () => void,
 *   onClearId: () => void,
 *   onShowGuide: () => void,
 * }} props
 */
export function ResultsArea({
  loading, canShowResults, filtered, paginated, hasMore,
  fuzzyPartSuggestions, viewMode,
  dTargetId1, dTargetId2, dTargetLen, allHoses,
  shortlist, toggleShortlist, rowCounts,
  onSelect, onLoadMore, onSearchByPart, onBrowseShapes,
  onApplyTolerances, onShowRow, onFindSimilar,
  onClearLength, onClearId, onShowGuide,
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <HoseCardSkeleton key={i} idx={i} />
        ))}
      </div>
    );
  }

  if (!canShowResults) {
    return <ResultsPlaceholder onBrowseShapes={onBrowseShapes} />;
  }

  if (filtered.length === 0) {
    return (
      <>
        {fuzzyPartSuggestions.length > 0 && (
          <div className="mb-4 rounded-[22px] border border-violet-400/25 bg-violet-500/8 p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Did you mean…</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {fuzzyPartSuggestions.map((h) => (
                <button
                  key={h.partNo}
                  type="button"
                  onClick={() => onSearchByPart(h.partNo)}
                  className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-100 transition hover:border-violet-400/40 hover:bg-white/[0.08] hover:text-white"
                >
                  <span className="font-semibold tabular">{h.partNo}</span>
                  <span className="text-xs text-zinc-400 tabular"><Dim value={h.hoseId} /> · <Dim value={h.length} /></span>
                </button>
              ))}
            </div>
          </div>
        )}
        <SmartEmptyState
          targetId1={dTargetId1}
          targetId2={dTargetId2}
          targetLen={dTargetLen}
          allHoses={allHoses}
          onSelect={onSelect}
          onApply={onApplyTolerances}
          onClearLength={onClearLength}
          onClearId={onClearId}
          onShowGuide={onShowGuide}
        />
      </>
    );
  }

  return (
    <>
      {viewMode === "compact" ? (
        <HoseCompactTable
          hoses={paginated}
          onSelect={onSelect}
          shortlist={shortlist}
          toggleShortlist={toggleShortlist}
          onShowRow={onShowRow}
          rowCounts={rowCounts}
        />
      ) : (
        <div className={viewMode === "list" ? "space-y-4" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
          <AnimatePresence mode="popLayout">
            {paginated.map((hose, i) => (
              viewMode === "list" ? (
                <HoseListCard
                  key={hose.partNo}
                  hose={hose}
                  idx={i}
                  onSelect={onSelect}
                  shortlist={shortlist}
                  toggleShortlist={toggleShortlist}
                  onShowRow={onShowRow}
                  onFindSimilar={onFindSimilar}
                  rowCount={rowCounts[hose.rowNo]}
                />
              ) : (
                <HoseCard
                  key={hose.partNo}
                  hose={hose}
                  idx={i}
                  onSelect={onSelect}
                  shortlist={shortlist}
                  toggleShortlist={toggleShortlist}
                  onShowRow={onShowRow}
                  onFindSimilar={onFindSimilar}
                  rowCount={rowCounts[hose.rowNo]}
                />
              )
            ))}
          </AnimatePresence>
        </div>
      )}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="rounded-2xl border-white/10 bg-white/5 px-8 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            Load more <ChevronDown className="ml-2 h-4 w-4" />
            <span className="ml-2 text-zinc-400 text-xs">({filtered.length - paginated.length} remaining)</span>
          </Button>
        </div>
      )}
    </>
  );
}
