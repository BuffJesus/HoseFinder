// Top-of-page hero. Brand eyebrow, two-line title, subtitle, and a row of
// CTAs:
//   - Start with measurements      — primary gradient button
//   - Browse by shape              — toggles the visual catalogue browser
//   - Measurement guide            — opens the how-to-measure dialog
//   - Shortcuts                    — opens the keyboard-help overlay (hidden
//                                    below the small breakpoint to save
//                                    space next to the other CTAs on phones)
//
// The live match count (N matching parts of M) sits to the right on wide
// screens, stacked under the title block on narrow ones. Its content lives
// inside <HeroLiveCount> so the hero itself stays purely structural.

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroLiveCount } from "./HeroLiveCount.jsx";
import { Kbd } from "./primitives.jsx";
import { PartNumberLookup } from "./PartNumberLookup.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   t: (key: string) => string,
 *   totalHoses: number,
 *   filteredCount: number,
 *   hasActiveFilters: boolean,
 *   onStart: () => void,
 *   onToggleShape: () => void,
 *   onShowGuide: () => void,
 *   onShowShortcuts: () => void,
 *   allHoses?: any[],
 *   onSelectHose?: (h: any) => void,
 * }} props
 */
export function Hero({
  t,
  totalHoses,
  filteredCount,
  hasActiveFilters,
  onStart,
  onToggleShape,
  onShowGuide,
  onShowShortcuts,
  allHoses = [],
  onSelectHose,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <Badge className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] tracking-[0.18em] text-zinc-300 backdrop-blur uppercase">
            {t("hero.eyebrow")}
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white md:text-6xl">
            {t("hero.title1")}
            <span className={`block bg-gradient-to-r ${ACCENT} bg-clip-text text-transparent`}>
              {t("hero.title2")}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            {t("hero.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              className={`rounded-2xl bg-gradient-to-r ${ACCENT} px-5 text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.6)] transition hover:shadow-[0_14px_44px_-8px_rgba(217,70,239,0.7)]`}
              onClick={onStart}
            >
              {t("hero.ctaStart")}
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-100 backdrop-blur transition hover:border-violet-400/30 hover:bg-white/[0.08]"
              onClick={onToggleShape}
            >
              {t("hero.ctaBrowse")}
            </Button>
            <button
              type="button"
              onClick={onShowGuide}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {t("hero.ctaGuide")}
            </button>
            <button
              type="button"
              onClick={onShowShortcuts}
              className="hidden items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white sm:inline-flex"
              aria-label={t("common.shortcuts")}
            >
              {t("common.shortcuts")} <Kbd>?</Kbd>
            </button>
          </div>
          {onSelectHose && allHoses.length > 0 && (
            <PartNumberLookup allHoses={allHoses} onMatch={onSelectHose} />
          )}
        </div>

        <HeroLiveCount
          total={totalHoses}
          filtered={filteredCount}
          hasFilters={hasActiveFilters}
        />
      </div>
    </motion.div>
  );
}
