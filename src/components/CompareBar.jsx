// Floating bottom-left bar that collects parts the user has added to the
// compare set. Collapses to a pill; expands to a list with a primary
// "Open side-by-side" CTA when 2+ parts are in compare.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountPill } from "./primitives.jsx";
import { Dim } from "../context/unit.jsx";
import { useLocale } from "../context/i18n.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   compared: any[],
 *   toggleCompare: (partNo: string) => void,
 *   clearCompare: () => void,
 *   open: boolean,
 *   onToggleOpen: () => void,
 *   onOpenCompareView: () => void,
 * }} props
 */
export function CompareBar({ compared, toggleCompare, clearCompare, open, onToggleOpen, onOpenCompareView }) {
  const { t } = useLocale();
  return (
    <motion.div
      layout
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className={`fixed bottom-3 left-3 z-40 overflow-hidden rounded-[32px] border border-white/10 backdrop-blur-xl shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(139,92,246,0.08)] sm:bottom-4 sm:left-4 ${
        open ? "w-[min(22rem,calc(100%-1.5rem))]" : "w-auto"
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
            aria-label={open ? "Hide compare list" : "Open compare list"}
            className={`flex min-w-0 items-center gap-3 text-left transition ${open ? "" : "rounded-2xl px-1.5 py-1 hover:bg-white/[0.04]"}`}
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-violet-300">
              <GitCompare className="h-4 w-4" />
              {!open && compared.length > 0 && (
                <span className={`absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} px-1 text-[10px] font-semibold tabular text-white shadow-[0_4px_10px_-2px_rgba(139,92,246,0.6)]`}>
                  {compared.length}
                </span>
              )}
            </span>
            {open && (
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">{t("compare.sideBySide")}</div>
                <div className="flex items-center gap-2 text-base font-semibold text-white">
                  {t("compare.compare")} <CountPill value={compared.length} max={3} />
                </div>
              </div>
            )}
          </button>
          {open && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" className="h-9 rounded-2xl px-3 text-xs text-zinc-400 hover:bg-white/10 hover:text-white" onClick={onToggleOpen}>
                {t("compare.hide")}
              </Button>
              <Button variant="ghost" className="h-9 rounded-2xl px-3 text-xs text-zinc-400 hover:bg-white/10 hover:text-white" onClick={clearCompare}>{t("compare.clear")}</Button>
            </div>
          )}
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2">
                {compared.map((h) => (
                  <motion.div
                    key={h.partNo}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white tabular">{h.partNo}</div>
                        <div className="text-xs text-zinc-400 tabular"><Dim value={h.hoseId} /> · <Dim value={h.length} /></div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white" onClick={() => toggleCompare(h.partNo)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
              {compared.length >= 2 && (
                <Button
                  onClick={onOpenCompareView}
                  className={`mt-3 w-full rounded-2xl border-0 bg-gradient-to-r ${ACCENT} px-4 text-white shadow-[0_8px_24px_-6px_rgba(139,92,246,0.5)] transition hover:shadow-[0_12px_30px_-6px_rgba(217,70,239,0.6)]`}
                >
                  <GitCompare className="mr-2 h-4 w-4" />
                  {t("compare.openSideBySide")}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
