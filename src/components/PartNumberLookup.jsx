// Inline reverse-lookup input. Sits below the hero CTAs as a quiet
// secondary entry point: "Already have a part number?" The builder types
// a known Gates part number; as soon as it matches an exact partNo in the
// catalog, the detail modal opens with that hose focused. No need to
// navigate the wizard at all.
//
// Intentionally minimal — a single input + a tiny label. No button, no
// dropdown. The moment the input matches, it fires onMatch. If nothing
// matches, the input just sits quietly with no error state (the builder
// might be typing something unrelated).

import React, { useState, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { useLocale } from "../context/i18n.jsx";

/**
 * @param {{
 *   allHoses: any[],
 *   onMatch: (hose: any) => void,
 * }} props
 */
export function PartNumberLookup({ allHoses, onMatch }) {
  const { t } = useLocale();
  const [value, setValue] = useState("");
  const indexRef = useRef(/** @type {Map<string, any> | null} */ (null));
  const hosesRef = useRef(allHoses);
  if (hosesRef.current !== allHoses) { indexRef.current = null; hosesRef.current = allHoses; }

  const getIndex = useCallback(() => {
    if (!indexRef.current && allHoses.length > 0) {
      indexRef.current = new Map(allHoses.map((h) => [h.partNo, h]));
    }
    return indexRef.current;
  }, [allHoses]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 5);
    setValue(raw);
    if (raw.length === 5) {
      const idx = getIndex();
      const hose = idx?.get(raw);
      if (hose) {
        onMatch(hose);
        setValue("");
      }
    }
  };

  return (
    <div className="mt-5 flex items-center gap-2">
      <Search className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
      <label htmlFor="hero-part-lookup" className="text-xs text-zinc-400">
        {t("hero.partLookup")}
      </label>
      <input
        id="hero-part-lookup"
        type="text"
        inputMode="numeric"
        maxLength={5}
        value={value}
        onChange={handleChange}
        placeholder="e.g. 24183"
        className="w-24 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-sm tabular text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none"
      />
    </div>
  );
}
