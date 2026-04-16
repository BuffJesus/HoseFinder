// Single-line "why this rank" summary for result cards. Surfaces the gap
// data that's already computed by scoreAndFilter — shows how the hose
// compares to what the user asked for, right on the card instead of
// requiring a detail-modal click. Hidden when no dimension filters are
// active (browsing mode has no spec to compare against).

import React from "react";
import { useUnit, useFmtDim } from "../context/unit.jsx";
import { useLocale } from "../context/i18n.jsx";

/**
 * @param {{ gap: any | null | undefined }} props
 */
export function GapOneLiner({ gap }) {
  const unitMode = useUnit();
  const fmtDim = useFmtDim();
  const { t } = useLocale();
  if (!gap) return null;
  if (!gap.idHasTgt && !gap.lenHasTgt) return null;

  const parts = [];

  if (gap.idHasTgt) {
    if (gap.idExact) {
      parts.push(`\u2713 ${t("gap.exactDiameter")}`);
    } else {
      parts.push(`${fmtDim(gap.idDelta, unitMode, 2)} ${gap.idDir || "off"}`);
    }
  }

  if (gap.lenHasTgt) {
    if (gap.lenExact) {
      parts.push(`\u2713 ${t("gap.exactLength")}`);
    } else {
      parts.push(`${fmtDim(gap.lenDelta, unitMode, 1)} ${gap.lenDir || "off"}`);
    }
  }

  if (parts.length === 0) return null;

  const allExact = (gap.idHasTgt ? gap.idExact : true) && (gap.lenHasTgt ? gap.lenExact : true);

  return (
    <div className={`mt-1.5 truncate text-[11px] ${
      allExact ? "text-emerald-300/90" : "text-zinc-400"
    }`}>
      {parts.join(" · ")}
    </div>
  );
}
