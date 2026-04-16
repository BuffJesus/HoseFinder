// Given the current value of one end (End 1 or End 2), return the set of
// partner diameters that actually appear alongside it in the catalogue.
// Used by CommonSizesPicker to dim out chip options that can't produce a
// real hose — the user's picks stay anchored to combinations that exist.
//
// A "partner" is any endSize belonging to the same hose that isn't the
// fixed end itself. We match with a 0.02" tolerance so "1.50" vs 1.5 vs
// 1.500 all unify. The returned set contains canonical numbers (Number
// typed, no trailing-zero string drift) so callers can compare with
// parseFloat(chipValue).

const MATCH_TOL = 0.02;

/**
 * @param {{ endSizes?: number[] }[]} allHoses
 * @param {string|number} fixedValue — inches as a string or number
 * @returns {Set<number> | null} null if `fixedValue` isn't a parseable
 *   number (no constraint); otherwise the set of partner diameters.
 */
export function validPairingsFor(allHoses, fixedValue) {
  const target = typeof fixedValue === "number" ? fixedValue : parseFloat(fixedValue);
  if (!isFinite(target)) return null;

  const valid = new Set();
  for (const h of allHoses) {
    const sizes = h?.endSizes;
    if (!sizes || sizes.length === 0) continue;
    const matchesFixed = sizes.some((s) => Math.abs(s - target) <= MATCH_TOL);
    if (!matchesFixed) continue;
    for (const s of sizes) {
      // Skip the fixed end itself — we want partners, not identities.
      if (Math.abs(s - target) <= MATCH_TOL) continue;
      // Round to 3 decimals to collapse float noise before set dedup.
      valid.add(Number(s.toFixed(3)));
    }
  }
  return valid;
}

/**
 * Check whether a single candidate partner is valid given the current fixed
 * value. Convenience for components that render one chip at a time.
 * @param {Set<number> | null} validSet
 * @param {string|number} candidate
 * @returns {boolean} true if no constraint, or if the candidate is in the set
 */
export function isPairingValid(validSet, candidate) {
  if (!validSet) return true;
  const n = typeof candidate === "number" ? candidate : parseFloat(candidate);
  if (!isFinite(n)) return false;
  for (const v of validSet) {
    if (Math.abs(v - n) <= MATCH_TOL) return true;
  }
  return false;
}
