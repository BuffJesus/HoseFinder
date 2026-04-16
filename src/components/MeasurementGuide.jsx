// Five-step how-to-measure explainer shown inside a dialog. Pure static
// content — no state, no filters.

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

const STEPS = [
  { title: "Identify hose type first", body: "Decide if you need a same-size hose, a reducer (two different ends), or a branched hose (bypass or auxiliary line). The catalog separates these, and so does the app." },
  { title: "Measure each connection separately", body: "Custom swaps often have different diameters at the engine neck, thermostat housing, radiator inlet, and filler neck. Measure every connection point — not just one end." },
  { title: "Match hose I.D. to tube O.D.", body: "Measure the outside diameter of the metal stub or neck. The hose inside diameter should match it closely. A ±0.06\" range is usually fine for a snug fit." },
  { title: "Measure the route, not straight-line", body: "Use a flexible wire, welding rod, or string to trace the actual path the hose needs to take. That gives you a useful centerline length estimate. Straight-line distance always undershoots." },
  { title: "Start broad, then tighten", body: "Enter your diameters and length, then set a generous tolerance first (± 2–3\"). Narrow it once you see which families fit. A beautiful finder should build confidence, not require perfection." },
];

export function MeasurementGuide() {
  return (
    <div className="space-y-3">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="group relative overflow-hidden rounded-[24px] border border-white/10 p-4 transition hover:border-violet-400/25"
          style={{
            background:
              "linear-gradient(160deg, rgba(20,20,28,0.7), rgba(10,10,15,0.7))",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          />
          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ACCENT} text-sm font-semibold tabular text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.55)]`}>
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white">{s.title}</div>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{s.body}</p>
            </div>
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 * STEPS.length, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-violet-400/25 p-4 text-sm leading-6 text-violet-100"
        style={{
          background:
            "linear-gradient(160deg, rgba(139,92,246,0.16), rgba(217,70,239,0.08) 60%, rgba(20,20,28,0.7))",
        }}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-70`} />
        <div className="flex items-start gap-2.5">
          <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.6)]`}>
            <Sparkles className="h-3 w-3" />
          </span>
          <div>
            <span className="font-semibold text-white">Pro tip — start broad, then tighten.</span>
            <span className="text-violet-100/80"> A good finder should feel like talking to a knowledgeable parts counter, not like querying a database.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
