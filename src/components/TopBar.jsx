// Slim fixed header that fades in after the user scrolls past the hero.
// Carries brand + live result count + unit/locale toggles + shortlist badge.

import React, { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Sparkles, Bookmark, ChevronDown, Wifi, WifiOff } from "lucide-react";
import { useLocale } from "../context/i18n.jsx";
import { AnimatedCount } from "./AnimatedCount.jsx";
import { UnitToggle, LocaleToggle } from "./toggles.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   total: number,
 *   filtered: number,
 *   hasFilters: boolean,
 *   shortlistCount: number,
 *   onShowShortlist: () => void,
 *   unitMode: "in"|"mm",
 *   setUnitMode?: (m: "in"|"mm") => void,
 *   locale: "en"|"es",
 *   setLocale?: (l: "en"|"es") => void,
 *   onOpenFieldMode?: () => void,
 *   fieldModeReady?: boolean,
 * }} props
 */
export function TopBar({
  total, filtered, hasFilters,
  shortlistCount, onShowShortlist,
  unitMode, setUnitMode, locale, setLocale,
  onOpenFieldMode, fieldModeReady,
}) {
  const { t } = useLocale();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    setVisible(y > 240);
  });
  const value = hasFilters ? filtered : total;
  const pct = total ? Math.min(100, (filtered / total) * 100) : 0;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 28 }}
          className="fixed inset-x-0 top-0 z-40"
        >
          <div className="mx-auto max-w-7xl px-4 pt-3 md:px-6 lg:px-8">
            <div
              className="relative overflow-hidden rounded-[20px] border border-white/10 backdrop-blur-xl"
              style={{
                background:
                  "linear-gradient(160deg, rgba(20,20,26,0.85), rgba(10,10,16,0.85))",
                boxShadow:
                  "0 14px 40px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-60`} />
              <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-4">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="group flex min-w-0 items-center gap-2.5 text-left"
                  aria-label={t("common.backToTop")}
                >
                  <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${ACCENT} shadow-[0_4px_14px_-2px_rgba(139,92,246,0.5)]`}>
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-zinc-400">{t("brand")}</span>
                    <span className="block truncate text-[11px] text-zinc-400 transition group-hover:text-white">{t("common.backToTop")}</span>
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:block">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-semibold tabular text-white"><AnimatedCount value={value} /></span>
                      <span className="text-[11px] text-zinc-400 tabular">/ {total.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={false}
                        animate={{ width: `${hasFilters ? pct : 100}%` }}
                        transition={{ type: "spring", stiffness: 160, damping: 24 }}
                        className={`h-full rounded-full bg-gradient-to-r ${ACCENT}`}
                      />
                    </div>
                  </div>
                  {onOpenFieldMode && (
                    <button
                      type="button"
                      onClick={onOpenFieldMode}
                      title={fieldModeReady ? "Offline ready" : "Set up offline mode"}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl border transition ${
                        fieldModeReady
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-violet-400/30 hover:text-white"
                      }`}
                    >
                      {fieldModeReady ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  {setLocale && <LocaleToggle locale={locale} onChange={setLocale} />}
                  {setUnitMode && <UnitToggle mode={unitMode} onChange={setUnitMode} />}
                  {shortlistCount > 0 && (
                    <button
                      type="button"
                      onClick={onShowShortlist}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-500/20"
                    >
                      <Bookmark className="h-3.5 w-3.5 fill-current" />
                      <span className="tabular">{shortlistCount}</span>
                      <span className="hidden sm:inline">saved</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-violet-400/30 hover:bg-white/[0.08] hover:text-white"
                    aria-label="Scroll to top"
                  >
                    <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
