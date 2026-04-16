// Shape / length / step-ratio bucket definitions — small but referenced by
// scoring, similarity, and the filter chips. Kept in one place so adding a
// new bucket only needs one edit. Pure data + light predicates.

/** @typedef {{ key: string, label: string, hint: string, match: (v: number) => boolean }} Bucket */

/** Reducer step-ratio buckets. Only meaningful for reducers (≥2 ends, differing sizes). */
/** @type {ReadonlyArray<Bucket>} */
export const STEP_RATIOS = [
  { key: "small",  label: "Small step",  hint: "1.0–1.3×", match: (r) => r >= 1.0 && r < 1.3 },
  { key: "medium", label: "Medium step", hint: "1.3–1.8×", match: (r) => r >= 1.3 && r < 1.8 },
  { key: "large",  label: "Large step",  hint: "≥ 1.8×",   match: (r) => r >= 1.8 },
];

/**
 * @param {{ endSizes?: number[] }} hose
 * @returns {number|null} max/min end ratio, or null when not a reducer.
 */
export function reducerStepRatio(hose) {
  if (!hose.endSizes || hose.endSizes.length < 2) return null;
  const max = Math.max(...hose.endSizes);
  const min = Math.min(...hose.endSizes.filter((s) => s > 0));
  if (!min || !max) return null;
  return max / min;
}

/** Coarse length buckets for users without a precise measurement. */
/** @type {ReadonlyArray<Bucket>} */
export const LENGTH_CLASSES = [
  { key: "stub",     label: "Stub",     hint: "< 6\"",   match: (l) => l < 6 },
  { key: "short",    label: "Short",    hint: "6–12\"",  match: (l) => l >= 6 && l < 12 },
  { key: "standard", label: "Standard", hint: "12–22\"", match: (l) => l >= 12 && l < 22 },
  { key: "long",     label: "Long",     hint: "> 22\"",  match: (l) => l >= 22 },
];
export const LENGTH_CLASS_BY_KEY = Object.fromEntries(
  LENGTH_CLASSES.map((c) => [c.key, c]),
);

/** Curvature groups. Each entry maps a user-facing label to one or more silhouette types. */
/** @type {ReadonlyArray<{ key: string, label: string, types: string[] }>} */
export const CURVATURE_GROUPS = [
  { key: "straight", label: "Straight",    types: ["gentle", "long"] },
  { key: "elbow",    label: "Elbow",       types: ["elbow", "shortElbow"] },
  { key: "sweep",    label: "Sweep",       types: ["sweep", "wideArc"] },
  { key: "compound", label: "Compound S",  types: ["compound", "deepS"] },
  { key: "z",        label: "Z-routing",   types: ["Zturn"] },
  { key: "hook",     label: "J-hook",      types: ["hook"] },
  { key: "branch",   label: "Branched",    types: ["branch", "branchY", "branchFour"] },
];

/** @type {Record<string, string>} silhouette type → curvature group key */
export const CURVATURE_BY_SIL = (() => {
  /** @type {Record<string, string>} */
  const m = {};
  CURVATURE_GROUPS.forEach((g) => g.types.forEach((t) => { m[t] = g.key; }));
  return m;
})();
