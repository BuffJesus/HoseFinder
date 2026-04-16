// Floating bottom-right bar: active project name + shortlist count + per-
// part list + Open BOM / Quick print / Clear. The project switcher lives
// here too, as a badge on the open header.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, FolderOpen, Printer, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountPill } from "./primitives.jsx";
import { Dim } from "../context/unit.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";
const SHORTLIST_LIMIT = 20;

/**
 * @param {{
 *   shortlisted: any[],
 *   open: boolean,
 *   onToggleOpen: () => void,
 *   onSelect: (h: any) => void,
 *   onToggleShortlist: (partNo: string) => void,
 *   onPrint: () => void,
 *   onClear: () => void,
 *   warning?: string,
 *   projectName?: string,
 *   projectCount?: number,
 *   onOpenProjects?: () => void,
 *   onOpenBom?: () => void,
 * }} props
 */
export function ShortlistBar({
  shortlisted, open, onToggleOpen, onSelect, onToggleShortlist,
  onPrint, onClear, warning,
  projectName, projectCount, onOpenProjects, onOpenBom,
}) {
  return (
    <motion.div
      layout
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className={`fixed bottom-3 right-3 z-40 overflow-hidden rounded-[32px] border border-white/10 backdrop-blur-xl shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(217,70,239,0.08)] sm:bottom-4 sm:right-4 ${
        open ? "w-[min(24rem,calc(100%-1.5rem))]" : "w-auto"
      }`}
      style={{
        background:
          "linear-gradient(160deg, rgba(20,20,26,0.92), rgba(10,10,16,0.92))",
      }}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-70`} />
      <div className={open ? "p-4" : "p-2"}>
        <div className={`flex items-center gap-2 ${open ? "justify-between" : ""}`}>
          <button
            type="button"
            onClick={onToggleOpen}
            aria-label={open ? "Hide shortlist" : "Open shortlist"}
            className={`flex min-w-0 items-center gap-3 text-left transition ${open ? "" : "rounded-2xl px-1.5 py-1 hover:bg-white/[0.04]"}`}
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fuchsia-300">
              <Bookmark className="h-4 w-4" />
              {!open && shortlisted.length > 0 && (
                <span className={`absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} px-1 text-[10px] font-semibold tabular text-white shadow-[0_4px_10px_-2px_rgba(217,70,239,0.6)]`}>
                  {shortlisted.length}
                </span>
              )}
            </span>
            {open && (
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Parts list</div>
                <div className="flex items-center gap-2 text-base font-semibold text-white">
                  <span className="truncate">{projectName || "Shortlist"}</span>
                  <CountPill value={shortlisted.length} max={SHORTLIST_LIMIT} />
                </div>
              </div>
            )}
          </button>
          {open && (
            <div className="flex items-center gap-1">
              {onOpenProjects && (
                <button
                  type="button"
                  onClick={onOpenProjects}
                  aria-label={`Switch project (${projectCount} total)`}
                  title="Projects"
                  className="inline-flex h-9 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 text-xs text-zinc-300 transition hover:border-violet-400/30 hover:bg-white/[0.08] hover:text-white"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span className="tabular">{projectCount}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggleOpen}
                className="h-9 rounded-2xl px-3 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                Hide
              </Button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {warning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
            >
              {warning}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {shortlisted.length > 0 ? (
                <>
                  <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {shortlisted.map((hose) => (
                      <motion.div
                        key={hose.partNo}
                        layout
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-violet-400/25 hover:bg-white/[0.06]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button type="button" onClick={() => onSelect(hose)} className="min-w-0 flex-1 text-left">
                            <div className="font-semibold text-white tabular">{hose.partNo}</div>
                            <div className="truncate text-xs text-zinc-400 tabular"><Dim value={hose.hoseId} /> · <Dim value={hose.length} /> · {hose.visualFamily}</div>
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                            onClick={() => onToggleShortlist(hose.partNo)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {onOpenBom && (
                      <Button onClick={onOpenBom} className={`rounded-2xl bg-gradient-to-r ${ACCENT} px-4 text-white shadow-[0_8px_24px_-6px_rgba(139,92,246,0.5)] transition hover:shadow-[0_12px_30px_-6px_rgba(217,70,239,0.6)]`}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Open BOM
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={onPrint}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Quick print
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onClear}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]"
                    >
                      Clear
                    </Button>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
                  Save parts from cards or the detail modal to build a printable list.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
