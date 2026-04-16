// Empty-state surface shown under the results header when the user
// hasn't entered enough input to narrow anything yet. Three pill CTAs
// for the three possible next steps: enter a diameter, enter a length,
// or open the shape browser. A floating sparkle icon draws attention
// without being loud.

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Ruler, ArrowUpDown, Layers3 } from "lucide-react";
import { useLocale } from "../context/i18n.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/** @param {{ onBrowseShapes: () => void }} props */
export function ResultsPlaceholder({ onBrowseShapes }) {
  const { t } = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[32px] border border-white/10"
      style={{
        background:
          "linear-gradient(160deg, rgba(139,92,246,0.08), rgba(217,70,239,0.04) 60%, rgba(20,20,26,0.95))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-50`} />
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-200"
          aria-hidden="true"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
        <div>
          <div className="text-xl font-semibold tracking-tight text-white">{t("results.placeholder.title")}</div>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-zinc-400">
            {t("results.placeholder.description")}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <Ruler className="h-3 w-3 text-violet-300" aria-hidden="true" /> {t("common.diameter")}
          </span>
          <span className="text-zinc-500" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <ArrowUpDown className="h-3 w-3 text-violet-300" aria-hidden="true" /> {t("common.length")}
          </span>
          <span className="text-zinc-500" aria-hidden="true">or</span>
          <button
            type="button"
            onClick={onBrowseShapes}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-500/20"
          >
            <Layers3 className="h-3 w-3" aria-hidden="true" /> {t("results.placeholder.browseShapes")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
