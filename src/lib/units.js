// Pure unit-conversion utilities. Canonical internal unit is inches; the
// active display mode ("in" | "mm") is passed explicitly — no context, no
// side effects. Component code keeps unit state; this file knows only math.
//
// Formatters accept an optional `locale` so digit grouping and the decimal
// separator follow the active UI language ("es" → comma decimal).

/** @typedef {"in" | "mm"} UnitMode */
/** @typedef {"en" | "es"} Locale */

export const MM_PER_IN = 25.4;

/**
 * Format a non-negative fixed-digit number using locale-appropriate
 * decimal separator. Falls back to `toFixed` for unknown locales so the
 * internal canonical inch strings stay stable.
 * @param {number} n
 * @param {number} digits
 * @param {Locale} [locale]
 * @returns {string}
 */
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

/**
 * Format a number that may have a trailing zero retained verbatim (e.g.
 * "1.50" should stay "1.50" in `en`, but become "1,50" in `es`).
 * @param {string} raw
 * @param {Locale} [locale]
 */
function localizeRaw(raw, locale) {
  if (locale !== "es") return raw;
  return raw.replace(/\./, ",");
}

/**
 * @param {number|string} inches
 * @param {UnitMode} mode
 * @param {{ digits?: number, locale?: Locale }} [opts]
 * @returns {string}
 */
export function fmtLen(inches, mode, opts = {}) {
  const { digits, locale } = opts;
  const n = typeof inches === "number" ? inches : parseFloat(inches);
  if (isNaN(n)) return "";
  if (mode === "mm") {
    return `${formatFixed(n * MM_PER_IN, digits ?? 1, locale)} mm`;
  }
  if (digits != null) return `${formatFixed(n, digits, locale)}"`;
  return `${localizeRaw(String(n), locale)}"`;
}

/**
 * Convert a canonical-inches string into whatever the active unit should
 * show. Inverse of parseUnitInput. Always emits a dot-decimal — this is
 * what gets fed back into `parseUnitInput`, so keep it locale-neutral.
 * @param {string} inchStr
 * @param {UnitMode} mode
 * @returns {string}
 */
export function inchStringToDisplay(inchStr, mode) {
  if (inchStr === "") return "";
  const n = parseFloat(inchStr);
  if (isNaN(n)) return "";
  if (mode === "mm") return (n * MM_PER_IN).toFixed(1);
  return inchStr;
}

/**
 * Input value in the active display unit → canonical inches string.
 * @param {string} displayStr
 * @param {UnitMode} mode
 * @returns {string}
 */
export function parseUnitInput(displayStr, mode) {
  if (displayStr === "") return "";
  const normalised = typeof displayStr === "string" ? displayStr.replace(",", ".") : displayStr;
  const n = parseFloat(normalised);
  if (isNaN(n)) return "";
  if (mode === "mm") return (n / MM_PER_IN).toFixed(3);
  return String(normalised);
}

/**
 * Format a dimension value that is natively in inches, handling compound
 * "1.5 X 2.0" reducer/branched strings.
 * @param {string|number|null|undefined} value
 * @param {UnitMode} mode
 * @param {number} [digits]
 * @param {Locale} [locale]
 * @returns {string}
 */
export function fmtDim(value, mode, digits, locale) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  if (/\sX\s/i.test(s)) {
    const parts = s.split(/\s+X\s+/i).map((p) => {
      const n = parseFloat(p);
      if (isNaN(n)) return p;
      if (mode === "mm") return formatFixed(n * MM_PER_IN, digits ?? 1, locale);
      return digits != null ? formatFixed(n, digits, locale) : localizeRaw(String(n), locale);
    });
    return mode === "mm" ? `${parts.join(" × ")} mm` : `${parts.join(" × ")}"`;
  }
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  if (mode === "mm") return `${formatFixed(n * MM_PER_IN, digits ?? 1, locale)} mm`;
  if (digits != null) return `${formatFixed(n, digits, locale)}"`;
  return `${localizeRaw(s, locale)}"`;
}
