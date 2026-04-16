// Wizard step scaffolding — the full step card shown while a step is
// active, and the one-line summary strip that replaces it once the step
// is filled (tapping the strip re-opens the step).

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   step: number,
 *   title: string,
 *   subtitle?: string,
 *   children: React.ReactNode,
 * }} props
 */
export function WizardStepCard({ step, title, subtitle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-6 overflow-hidden rounded-[32px] border border-white/10 backdrop-blur-xl"
      style={{
        background:
          "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.10), transparent 60%)," +
          "radial-gradient(28rem 10rem at 100% 0%, rgba(217,70,239,0.06), transparent 60%)," +
          "linear-gradient(180deg, rgba(20,20,28,0.7), rgba(10,10,15,0.7))",
        boxShadow:
          "0 24px 80px -28px rgba(139,92,246,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-60`} />
      <div className="p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ACCENT} text-base font-semibold text-white tabular shadow-[0_8px_24px_-6px_rgba(139,92,246,0.55)]`}>
            {step}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Step {step}</div>
            <h3 className="mt-0.5 text-xl font-semibold tracking-tight text-white">{title}</h3>
            {subtitle && <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">{subtitle}</p>}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </motion.div>
  );
}

/**
 * @param {{
 *   label: string,
 *   value: string,
 *   onClick: () => void,
 * }} props
 */
export function WizardSummaryStrip({ label, value, onClick }) {
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-white/10"
    >
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">{label}</div>
        <div className="truncate text-sm font-medium text-white">{value}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-zinc-400" />
    </button>
  );
}
