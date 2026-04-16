// Text input that accepts "1-1/2", "38mm", "3/4", "1.5" etc. and commits
// canonical inches to the caller. Emits suggestion chips for partial
// fractions and exposes a recent-measurements dropdown when `historyKey`
// is set. All format math lives in lib/naturalSize; this file is glue.

import React, { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUnit, Dim } from "../context/unit.jsx";
import { MM_PER_IN, inchStringToDisplay } from "../lib/units.js";
import { parseNaturalSize, fractionSuggestionsFor } from "../lib/naturalSize.js";
import {
  loadMeasurementHistory, pushMeasurementHistory, formatRelativeTime,
} from "../lib/measurementHistory.js";

/**
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (v: string) => void,
 *   placeholder?: string,
 *   className?: string,
 *   historyKey?: string,
 * }} props
 */
export function NaturalDimInput({ id, value, onChange, placeholder, className = "", historyKey }) {
  const mode = useUnit();
  const canonicalDisplay = inchStringToDisplay(value, mode);
  const [draft, setDraft] = useState(canonicalDisplay);
  const [focused, setFocused] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);

  useEffect(() => {
    if (!focused) setDraft(canonicalDisplay);
  }, [canonicalDisplay, focused]);

  const commit = (raw) => {
    if (raw === "") { onChange(""); return true; }
    const parsed = parseNaturalSize(raw, mode);
    if (parsed == null) return false;
    const inches = mode === "mm" ? parsed / MM_PER_IN : parsed;
    onChange(inches.toFixed(3));
    return true;
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setDraft(v);
    if (v === "") { onChange(""); return; }
    const parsed = parseNaturalSize(v, mode);
    if (parsed != null) {
      const inches = mode === "mm" ? parsed / MM_PER_IN : parsed;
      onChange(inches.toFixed(3));
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (commit(draft)) {
      setDraft(inchStringToDisplay(value, mode));
      if (historyKey && value) pushMeasurementHistory(historyKey, value);
    }
    setHistoryOpen(false);
  };

  const suggestions = focused ? fractionSuggestionsFor(draft) : [];
  const history = useMemo(
    () => (historyKey ? (loadMeasurementHistory()[historyKey] || []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyKey, historyTick, historyOpen],
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`min-h-11 rounded-2xl border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-600 ${historyKey && history.length > 0 ? "pr-10" : ""}`}
        />
        {historyKey && history.length > 0 && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setHistoryTick((t) => t + 1); setHistoryOpen((o) => !o); }}
            aria-label="Recent measurements"
            title="Recent measurements"
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-violet-300"
          >
            <Clock className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {historyOpen && history.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.8)]">
          <div className="px-2 pb-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">Recent</div>
          {history.map((e) => (
            <button
              key={`${e.at}-${e.inches}`}
              type="button"
              onMouseDown={(evt) => {
                evt.preventDefault();
                onChange(e.inches);
                setDraft(inchStringToDisplay(e.inches, mode));
                setHistoryOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left text-sm text-zinc-100 transition hover:bg-white/[0.06]"
            >
              <span className="tabular font-semibold"><Dim value={e.inches} /></span>
              <span className="text-[11px] text-zinc-400">{formatRelativeTime(e.at)}</span>
            </button>
          ))}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {suggestions.map((f) => (
            <button
              key={f.label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                const inches = f.inches;
                onChange(inches.toFixed(3));
                setDraft(inchStringToDisplay(inches.toFixed(3), mode));
                if (historyKey) pushMeasurementHistory(historyKey, inches.toFixed(3));
              }}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] tabular text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
            >
              {f.label}{mode === "mm" ? ` (${(f.inches * MM_PER_IN).toFixed(1)} mm)` : "\""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
