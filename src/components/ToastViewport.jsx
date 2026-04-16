// Toast render surface. Lives once at the root; takes the toast list as a
// prop. Polite live-region so assistive tech announces saves / warnings
// without hijacking focus.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * @typedef {{
 *   id: string,
 *   message: string,
 *   icon?: any,
 *   tone?: "warning"|"error"|undefined,
 *   action?: { label: string, onClick: () => void },
 * }} Toast
 *
 * @param {{ toasts: Toast[] }} props
 */
export function ToastViewport({ toasts }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-3 sm:bottom-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = t.icon || Sparkles;
            const tone = t.tone === "warning"
              ? "border-amber-400/30 bg-amber-500/12 text-amber-100"
              : t.tone === "error"
                ? "border-red-400/30 bg-red-500/12 text-red-100"
                : "border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-violet-100";
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={`pointer-events-auto inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm backdrop-blur-xl shadow-[0_16px_48px_-20px_rgba(0,0,0,0.7)] ${tone}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">{t.message}</span>
                {t.action && (
                  <button
                    type="button"
                    onClick={t.action.onClick}
                    className="ml-2 shrink-0 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition hover:border-white/40 hover:bg-white/20"
                  >
                    {t.action.label}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
