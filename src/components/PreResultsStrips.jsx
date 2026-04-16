// The four strips that sit between the Refine disclosure and the
// ResultsHeader: SavedSearches (if any), LengthClassChips, CurvatureChips,
// and StepRatioChips (reducers only). All share the same precondition —
// the user has enough state to actually produce results.
//
// The ActiveFilterStrip renders *below* these strips whether or not we
// can show results, because a stale filter pill is useful even if the
// current combination returns zero hoses.

import React from "react";
import { SavedSearchesStrip } from "./SavedSearchesStrip.jsx";
import { LengthClassChips, CurvatureChips, StepRatioChips } from "./filter-chips.jsx";
import { ActiveFilterStrip } from "./ActiveFilterStrip.jsx";

/**
 * @param {{
 *   canShowResults: boolean,
 *   loading: boolean,
 *   hasActiveFilters: boolean,
 *   flow: string,
 *   // saved searches
 *   savedSearches: any[],
 *   applySavedSearch: (s: any) => void,
 *   removeSavedSearch: (id: string) => void,
 *   saveCurrentSearch: () => void,
 *   shareCurrentSearch: () => void,
 *   // candidate lists feeding the chip counts
 *   lengthClassCandidates: any[],
 *   curvatureCandidates: any[],
 *   stepRatioCandidates: any[],
 *   // chip state
 *   lengthClass: Set<string>,
 *   setLengthClass: (s: Set<string>) => void,
 *   curvature: Set<string>,
 *   setCurvature: (s: Set<string>) => void,
 *   stepRatio: Set<string>,
 *   setStepRatio: (s: Set<string>) => void,
 *   // active-filter-strip props
 *   targetId1: string, targetId2: string, targetLen: string,
 *   idTol: number, lenTol: number,
 *   selectedRows: Set<number>,
 *   rowMetaByNo: Record<number, any>,
 *   filteredCount: number,
 *   onClearId: () => void,
 *   onClearLen: () => void,
 *   onClearType: () => void,
 *   onClearRows: () => void,
 * }} props
 */
export function PreResultsStrips({
  canShowResults, loading, hasActiveFilters, flow,
  savedSearches, applySavedSearch, removeSavedSearch,
  saveCurrentSearch, shareCurrentSearch,
  lengthClassCandidates, curvatureCandidates, stepRatioCandidates,
  lengthClass, setLengthClass,
  curvature, setCurvature,
  stepRatio, setStepRatio,
  targetId1, targetId2, targetLen,
  idTol, lenTol,
  selectedRows, rowMetaByNo, filteredCount,
  onClearId, onClearLen, onClearType, onClearRows,
}) {
  return (
    <>
      {canShowResults && !loading && (
        <>
          <SavedSearchesStrip
            items={savedSearches}
            onApply={applySavedSearch}
            onRemove={removeSavedSearch}
            onSave={saveCurrentSearch}
            onShare={shareCurrentSearch}
            canSave={hasActiveFilters}
          />
          <LengthClassChips
            candidates={lengthClassCandidates}
            value={lengthClass}
            onChange={setLengthClass}
          />
          <CurvatureChips
            candidates={curvatureCandidates}
            value={curvature}
            onChange={setCurvature}
          />
          {flow === "reducer" && (
            <StepRatioChips
              candidates={stepRatioCandidates}
              value={stepRatio}
              onChange={setStepRatio}
            />
          )}
        </>
      )}
      <ActiveFilterStrip
        targetId1={targetId1}
        targetId2={targetId2}
        targetLen={targetLen}
        idTol={idTol}
        lenTol={lenTol}
        flow={flow}
        selectedRows={selectedRows}
        rowMetaByNo={rowMetaByNo}
        resultCount={filteredCount}
        onClearId={onClearId}
        onClearLen={onClearLen}
        onClearType={onClearType}
        onClearRows={onClearRows}
      />
    </>
  );
}
