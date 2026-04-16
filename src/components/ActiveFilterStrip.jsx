// Row of removable pills representing every currently-active filter. Lives
// above the results. Clicking × on a pill removes that filter immediately —
// no "apply" step. Hidden when no filters are active.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, ArrowUpDown, GitCompare, Layers3, Filter, X } from "lucide-react";
import { useUnit, useFmtDim } from "../context/unit.jsx";
import { MM_PER_IN } from "../lib/units.js";

/**
 * @param {{
 *   targetId1: string, targetId2: string, targetLen: string,
 *   idTol: number, lenTol: number,
 *   flow: string,
 *   selectedRows: Set<number>,
 *   rowMetaByNo: Record<number, { familyLabel?: string } | undefined>,
 *   resultCount?: number,
 *   onClearId: () => void,
 *   onClearLen: () => void,
 *   onClearType: () => void,
 *   onClearRows: () => void,
 * }} props
 */
export function ActiveFilterStrip({
  targetId1, targetId2, targetLen, idTol, lenTol, flow,
  selectedRows, rowMetaByNo,
  onClearId, onClearLen, onClearType, onClearRows,
}) {
  const unitMode = useUnit();
  const fmtDim = useFmtDim();
  const pills = [];

  if (targetId1 || targetId2) {
    const sizes = [
      targetId1 && fmtDim(targetId1, unitMode),
      targetId2 && fmtDim(targetId2, unitMode),
    ].filter(Boolean).join(" × ");
    const tolStr = unitMode === "mm"
      ? `±${(idTol * MM_PER_IN).toFixed(1)} mm`
      : `±${idTol.toFixed(2)}"`;
    pills.push({
      key: "id", icon: Ruler,
      label: `ID ${sizes}`, tag: tolStr, onRemove: onClearId,
    });
  }

  if (targetLen) {
    pills.push({
      key: "len", icon: ArrowUpDown,
      label: `Length ${fmtDim(targetLen, unitMode)}`,
      tag: lenTol >= 99
        ? "any"
        : (unitMode === "mm" ? `±${(lenTol * MM_PER_IN).toFixed(0)} mm` : `±${lenTol.toFixed(1)}"`),
      onRemove: onClearLen,
    });
  }

  if (flow !== "all") {
    const flowLabel = ({ single: "Same-size", reducer: "Reducer", branched: "Branched" })[flow] || flow;
    pills.push({ key: "flow", icon: GitCompare, label: flowLabel, onRemove: onClearType });
  }

  if (selectedRows.size > 0) {
    const selected = Array.from(selectedRows);
    const rowLabel = selected.length === 1
      ? (rowMetaByNo[selected[0]]?.familyLabel || `Shape row ${selected[0]}`)
      : `${selected.length} shape families`;
    pills.push({ key: "rows", icon: Layers3, label: rowLabel, onRemove: onClearRows });
  }

  return (
    <AnimatePresence initial={false}>
      {pills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mb-3 overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              <Filter className="h-3 w-3" /> Active
            </span>
            <AnimatePresence initial={false}>
              {pills.map((pill) => {
                const Icon = pill.icon;
                return (
                  <motion.span
                    key={pill.key}
                    layout
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 py-1 pl-2.5 pr-1 text-xs text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-500/20"
                  >
                    <Icon className="h-3 w-3 text-violet-300" />
                    <span className="tabular">{pill.label}</span>
                    {pill.tag && (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] tabular text-violet-200">
                        {pill.tag}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={pill.onRemove}
                      aria-label="Remove filter"
                      className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-violet-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
