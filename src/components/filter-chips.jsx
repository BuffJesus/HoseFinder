// Three filter chip strips that sit above the results grid:
//   - StepRatio (reducers only)
//   - LengthClass  (coarse length bucket)
//   - Curvature    (multi-select silhouette family)
// All share the same shape: counts per bucket from a candidate list + a
// `value` Set driving active state + an `onChange(Set)` callback.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Layers3, GitCompare, ArrowUpDown, X } from "lucide-react";
import {
  STEP_RATIOS, LENGTH_CLASSES, CURVATURE_GROUPS, CURVATURE_BY_SIL, reducerStepRatio,
} from "../lib/shapeBuckets.js";
import { HoseSilhouette } from "./HoseSilhouette.jsx";

function toggleInSet(value, key, onChange) {
  const next = new Set(value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  onChange(next);
}

/** @param {{ candidates: any[], value: Set<string>, onChange: (s: Set<string>) => void }} props */
export function StepRatioChips({ candidates, value, onChange }) {
  const counts = useMemo(() => {
    const m = {};
    STEP_RATIOS.forEach((s) => { m[s.key] = 0; });
    for (const h of candidates) {
      const r = reducerStepRatio(h);
      if (r === null) continue;
      for (const s of STEP_RATIOS) {
        if (s.match(r)) { m[s.key]++; break; }
      }
    }
    return m;
  }, [candidates]);

  const visible = STEP_RATIOS.filter((s) => counts[s.key] > 0 || value.has(s.key));
  if (visible.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mb-3 flex flex-wrap items-center gap-2"
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        <GitCompare className="h-3 w-3" /> Step
      </span>
      {visible.map((s) => {
        const active = value.has(s.key);
        const count = counts[s.key];
        return (
          <motion.button
            key={s.key}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => toggleInSet(value, s.key, onChange)}
            disabled={!active && count === 0}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs transition ${
              active
                ? "border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.55)]"
                : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-violet-400/25 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            <span className="font-medium">{s.label}</span>
            <span className="text-[10px] tabular text-zinc-500">{s.hint}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular ${
              active ? "bg-white/15 text-white" : "bg-white/[0.06] text-zinc-400"
            }`}>
              {count}
            </span>
          </motion.button>
        );
      })}
      {value.size > 0 && (
        <button
          type="button"
          onClick={() => onChange(new Set())}
          className="ml-1 inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </motion.div>
  );
}

/** @param {{ candidates: any[], value: Set<string>, onChange: (s: Set<string>) => void }} props */
export function LengthClassChips({ candidates, value, onChange }) {
  const counts = useMemo(() => {
    const m = {};
    LENGTH_CLASSES.forEach((c) => { m[c.key] = 0; });
    for (const h of candidates) {
      for (const c of LENGTH_CLASSES) {
        if (c.match(h.length)) { m[c.key]++; break; }
      }
    }
    return m;
  }, [candidates]);

  const visible = LENGTH_CLASSES.filter((c) => counts[c.key] > 0 || value.has(c.key));
  if (visible.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mb-3 flex flex-wrap items-center gap-2"
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        <ArrowUpDown className="h-3 w-3" /> Length
      </span>
      {visible.map((c) => {
        const active = value.has(c.key);
        const count = counts[c.key];
        return (
          <motion.button
            key={c.key}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => toggleInSet(value, c.key, onChange)}
            disabled={!active && count === 0}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs transition ${
              active
                ? "border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.55)]"
                : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-violet-400/25 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            <span className="font-medium">{c.label}</span>
            <span className="text-[10px] tabular text-zinc-500">{c.hint}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular ${
              active ? "bg-white/15 text-white" : "bg-white/[0.06] text-zinc-400"
            }`}>
              {count}
            </span>
          </motion.button>
        );
      })}
      {value.size > 0 && (
        <button
          type="button"
          onClick={() => onChange(new Set())}
          className="ml-1 inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </motion.div>
  );
}

/** @param {{ candidates: any[], value: Set<string>, onChange: (s: Set<string>) => void }} props */
export function CurvatureChips({ candidates, value, onChange }) {
  const counts = useMemo(() => {
    const m = {};
    CURVATURE_GROUPS.forEach((g) => { m[g.key] = 0; });
    for (const h of candidates) {
      const k = CURVATURE_BY_SIL[h.silhouette];
      if (k) m[k]++;
    }
    return m;
  }, [candidates]);

  const visible = CURVATURE_GROUPS.filter((g) => counts[g.key] > 0 || value.has(g.key));
  if (visible.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mb-3 flex flex-wrap items-center gap-2"
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        <Layers3 className="h-3 w-3" /> Curvature
      </span>
      {visible.map((g) => {
        const active = value.has(g.key);
        const count = counts[g.key];
        const glyph = g.types[0];
        return (
          <motion.button
            key={g.key}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => toggleInSet(value, g.key, onChange)}
            disabled={!active && count === 0}
            className={`group inline-flex items-center gap-2 rounded-2xl border py-1 pl-1.5 pr-2.5 text-xs transition ${
              active
                ? "border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.55)]"
                : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-violet-400/25 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            <span className={`flex h-6 w-9 items-center justify-center rounded-xl border ${
              active
                ? "border-violet-300/40 bg-violet-500/15 text-violet-100"
                : "border-white/10 bg-black/30 text-violet-300 group-hover:text-violet-200"
            }`}>
              <HoseSilhouette type={glyph} />
            </span>
            <span className="font-medium">{g.label}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular ${
              active ? "bg-white/15 text-white" : "bg-white/[0.06] text-zinc-400"
            }`}>
              {count}
            </span>
          </motion.button>
        );
      })}
      {value.size > 0 && (
        <button
          type="button"
          onClick={() => onChange(new Set())}
          className="ml-1 inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </motion.div>
  );
}
