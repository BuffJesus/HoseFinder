// Step 1 of the wizard: three flow-type cards (Same-size / Reducer /
// Branched). Each card is a tappable surface that sets the flow mode and
// advances to step 2. The active card gets a gradient accent hairline and
// a morphing silhouette that matches the chosen flow. Data lives in
// FLOW_CARDS so tests + storybook reuse it without touching presentation.

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MorphingHoseSilhouette } from "./HoseSilhouette.jsx";
import { FLOW_CARDS } from "../lib/wizardSummaries.js";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   flow: string,
 *   onSelect: (key: "single" | "reducer" | "branched") => void,
 * }} props
 */
export function FlowCards({ flow, onSelect }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {FLOW_CARDS.map((card, i) => {
        const active = flow === card.key;
        return (
          <motion.button
            key={card.key}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onSelect(card.key)}
            aria-pressed={active}
            className={`group relative overflow-hidden rounded-[28px] border p-5 text-left transition-[border-color,background-color,box-shadow] duration-300 ${
              active
                ? "border-violet-400/40 bg-violet-950/60 shadow-[0_18px_60px_-20px_rgba(139,92,246,0.55)]"
                : "border-zinc-800 bg-zinc-900 hover:border-violet-400/25 hover:bg-zinc-900 hover:shadow-[0_18px_60px_-28px_rgba(139,92,246,0.45)]"
            }`}
          >
            {active && (
              <motion.div
                layoutId="flowCardGlow"
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${ACCENT}`}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
              />
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-base font-semibold text-white">{card.title}</div>
                  {active && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 22 }}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.7)]`}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </motion.span>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-6 text-zinc-400">{card.body}</p>
              </div>
              <Badge
                className={`rounded-full border-0 shrink-0 transition-colors ${
                  active ? `bg-gradient-to-r ${ACCENT}` : "bg-white/10 text-zinc-300 group-hover:bg-white/15"
                }`}
              >
                {card.chip}
              </Badge>
            </div>
            <div
              className={`mt-4 rounded-[20px] border p-3 transition-colors duration-300 ${
                active
                  ? "border-violet-400/30 text-violet-200"
                  : "border-white/10 text-violet-300 group-hover:border-violet-400/20 group-hover:text-violet-200"
              }`}
              style={{ background: active ? "rgba(15,10,30,0.55)" : "rgba(0,0,0,0.4)" }}
            >
              <div className="h-16">
                <MorphingHoseSilhouette family={card.key} />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
