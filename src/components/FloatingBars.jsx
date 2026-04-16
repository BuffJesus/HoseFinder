// Bottom-fixed floating bars that overlay the main flow. Mount after
// </main> so keyboard flow finishes the content before reaching them,
// but above any modal mount points so they remain layered correctly
// when a modal opens. Each bar self-animates via AnimatePresence — the
// parent just keeps mounting it whenever its precondition is true.

import React from "react";
import { AnimatePresence } from "framer-motion";
import { CompareBar } from "./CompareBar.jsx";
import { ShortlistBar } from "./ShortlistBar.jsx";

/**
 * @param {{
 *   compare: {
 *     compared: any[],
 *     toggleCompare: (partNo: string) => void,
 *     clearCompare: () => void,
 *     open: boolean, onToggleOpen: () => void,
 *     onOpenCompareView: () => void,
 *   },
 *   shortlist: {
 *     shortlisted: any[],
 *     warning: string | null,
 *     open: boolean, onToggleOpen: () => void,
 *     onSelect: (h: any) => void,
 *     onToggleShortlist: (partNo: string) => void,
 *     onPrint: () => void,
 *     onClear: () => void,
 *     projectName?: string,
 *     projectCount: number,
 *     onOpenProjects: () => void,
 *     onOpenBom?: () => void,
 *   },
 * }} props
 */
export function FloatingBars({ compare, shortlist }) {
  const compareVisible = compare.compared.length > 0;
  const shortlistVisible = shortlist.shortlisted.length > 0 || shortlist.warning || shortlist.open;
  return (
    <>
      <AnimatePresence>
        {compareVisible && (
          <CompareBar
            compared={compare.compared}
            toggleCompare={compare.toggleCompare}
            clearCompare={compare.clearCompare}
            open={compare.open}
            onToggleOpen={compare.onToggleOpen}
            onOpenCompareView={compare.onOpenCompareView}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shortlistVisible && (
          <ShortlistBar
            shortlisted={shortlist.shortlisted}
            open={shortlist.open}
            onToggleOpen={shortlist.onToggleOpen}
            onSelect={shortlist.onSelect}
            onToggleShortlist={shortlist.onToggleShortlist}
            onPrint={shortlist.onPrint}
            onClear={shortlist.onClear}
            warning={shortlist.warning}
            projectName={shortlist.projectName}
            projectCount={shortlist.projectCount}
            onOpenProjects={shortlist.onOpenProjects}
            onOpenBom={shortlist.onOpenBom}
          />
        )}
      </AnimatePresence>
    </>
  );
}
