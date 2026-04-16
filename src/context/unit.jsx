// Unit context + the `<Dim>` JSX helper that reads it. Colocated so any
// component that wants to display an inches-native value can import both
// the context and the renderer from a single module.
//
// Canonical internal unit is inches; the context value ("in" | "mm") drives
// how `<Dim>` formats. `parseUnitInput`, `fmtDim`, `inchStringToDisplay` in
// `src/lib/units.js` do the math — this file just wires them to React.

import React, { createContext, useContext, useMemo } from "react";
import { MM_PER_IN, fmtDim as fmtDimLib } from "../lib/units.js";
import { useLocale } from "./i18n.jsx";

/** @typedef {"in" | "mm"} UnitMode */

export const UnitContext = createContext(/** @type {UnitMode} */ ("in"));
export const useUnit = () => useContext(UnitContext);

/**
 * Hook that returns a `fmtDim` bound to the active locale. Components call
 * `const fmt = useFmtDim()` and then `fmt(value, unit, digits)` — decimal
 * separators follow the current locale without having to thread it through.
 * @returns {(value: string|number|null|undefined, mode: UnitMode, digits?: number) => string}
 */
export function useFmtDim() {
  const { locale } = useLocale();
  return useMemo(
    () => (value, mode, digits) => fmtDimLib(value, mode, digits, locale),
    [locale],
  );
}

function formatFixed(n, digits, locale) {
  if (locale === "es") {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: false,
    }).format(n);
  }
  return n.toFixed(digits);
}

function localizeRaw(raw, locale) {
  if (locale !== "es") return raw;
  return raw.replace(/\./, ",");
}

/**
 * Dimension display that reads the active unit from context. Handles
 * compound "1.5 X 2.0" reducer/branched strings.
 * @param {{ value: string|number|null|undefined, digits?: number }} props
 */
export function Dim({ value, digits }) {
  const mode = useUnit();
  const { locale } = useLocale();
  const s = String(value ?? "").trim();
  if (!s) return null;
  const unit = mode === "mm" ? "mm" : "\"";
  const spacer = mode === "mm" ? " " : "";
  if (/\sX\s/i.test(s)) {
    const parts = s.split(/\s+X\s+/i).map((p) => {
      const n = parseFloat(p);
      if (isNaN(n)) return p;
      if (mode === "mm") return formatFixed(n * MM_PER_IN, digits ?? 1, locale);
      return digits != null ? formatFixed(n, digits, locale) : localizeRaw(String(n), locale);
    });
    return <>{parts.join(" × ")}{spacer}<span className="opacity-60">{unit}</span></>;
  }
  const n = parseFloat(s);
  if (isNaN(n)) return <>{s}</>;
  const body = mode === "mm"
    ? formatFixed(n * MM_PER_IN, digits ?? 1, locale)
    : (digits != null ? formatFixed(n, digits, locale) : localizeRaw(s, locale));
  return <>{body}{spacer}<span className="opacity-60">{unit}</span></>;
}
