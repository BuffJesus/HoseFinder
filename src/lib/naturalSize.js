// parseNaturalSize — interpret whatever the user typed (fractions, mixed
// numbers, mm suffix, inch marks, plain decimals) as a numeric value in the
// active display unit. Returns null when unparseable.

import { MM_PER_IN } from "./units.js";

/**
 * @typedef {import("./units.js").UnitMode} UnitMode
 * @param {string|null|undefined} str
 * @param {UnitMode} mode
 * @returns {number|null} Value in the active display unit, or null if unparseable.
 */
export function parseNaturalSize(str, mode) {
  if (str == null) return null;
  const raw = String(str).trim();
  if (!raw) return null;

  // Explicit metric wins regardless of current mode.
  const mmMatch = raw.match(/^(-?\d+(?:\.\d+)?)\s*mm\b/i);
  if (mmMatch) {
    const mm = parseFloat(mmMatch[1]);
    if (!isFinite(mm)) return null;
    return mode === "mm" ? mm : mm / MM_PER_IN;
  }

  const cleaned = raw
    .replace(/["″]/g, " ")
    .replace(/\binches?\b|\bin\b/gi, " ")
    .replace(/^\s*(-?\d+(?:\.\d+)?)-(\d+\/\d+)\s*$/, "$1 $2")  // 1-1/2 → 1 1/2
    .replace(/\s+/g, " ")
    .trim();

  const mixed = cleaned.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = parseInt(mixed[1], 10);
    const num = parseInt(mixed[2], 10);
    const den = parseInt(mixed[3], 10);
    if (!den) return null;
    const sign = whole < 0 ? -1 : 1;
    const value = Math.abs(whole) + num / den;
    const inches = sign * value;
    return mode === "mm" ? inches * MM_PER_IN : inches;
  }

  const frac = cleaned.match(/^(-?\d+)\/(\d+)$/);
  if (frac) {
    const num = parseInt(frac[1], 10);
    const den = parseInt(frac[2], 10);
    if (!den) return null;
    const inches = num / den;
    return mode === "mm" ? inches * MM_PER_IN : inches;
  }

  const dec = cleaned.match(/^(-?\d+(?:\.\d+)?)$/);
  if (dec) return parseFloat(dec[1]);

  return null;
}

export const COMMON_FRACTIONS = [
  { label: "1/4",  inches: 0.25 },
  { label: "3/8",  inches: 0.375 },
  { label: "1/2",  inches: 0.5 },
  { label: "5/8",  inches: 0.625 },
  { label: "3/4",  inches: 0.75 },
  { label: "7/8",  inches: 0.875 },
];

/**
 * @param {string|null|undefined} raw
 * @returns {ReadonlyArray<{label: string, inches: number}>}
 */
export function fractionSuggestionsFor(raw) {
  const s = String(raw || "").trim();
  if (!s) return [];
  if (/^\d+\/?$/.test(s)) return COMMON_FRACTIONS;
  if (/^\d+\s+\d+\/?$/.test(s)) return COMMON_FRACTIONS;
  const partial = s.match(/(\d+)\/(\d*)$/);
  if (partial) {
    const num = partial[1];
    return COMMON_FRACTIONS.filter((f) => f.label.startsWith(`${num}/`));
  }
  return [];
}
