// Geometric shape classifier. Takes a shape signature (from the offline
// extractor or the bend-builder) and returns the silhouette type that
// best represents the hose's actual geometry. Replaces the old rowNo-hash
// assignment which had no relationship to real shape.
//
// The classifier uses a simple decision tree over bendCount,
// arcToChordRatio, and the max/mean bend angles. Each leaf maps to one
// of the SVG silhouette types defined in HoseSilhouette.jsx.

/**
 * @typedef {{
 *   bendCount: number,
 *   bendAngles?: number[],
 *   arcToChordRatio: number,
 *   branchCount?: number,
 * }} ShapeSignature
 */

/**
 * Classify a shape signature into a silhouette type.
 * @param {ShapeSignature | null | undefined} shape
 * @param {{ hoseType?: string, endCount?: number }} [context]
 * @returns {string} silhouette key (e.g. "gentle", "elbow", "compound")
 */
export function classifyShape(shape, context = {}) {
  const { hoseType, endCount } = context;

  // Branched hoses keep the end-count-based classification — the geometry
  // of a T/Y/4-way junction doesn't map to the single-path silhouettes.
  if (hoseType === "branched") {
    return (endCount ?? 0) >= 4 ? "branchFour" : (endCount ?? 0) >= 3 ? "branchY" : "branch";
  }

  if (!shape || typeof shape.bendCount !== "number") return "sweep";

  const { bendCount, arcToChordRatio: atc } = shape;
  const angles = shape.bendAngles || [];
  const maxAngle = angles.length > 0 ? Math.max(...angles) : 0;
  const meanAngle = angles.length > 0
    ? angles.reduce((a, b) => a + b, 0) / angles.length
    : 0;

  // ── Straight-ish: very few bends AND low arc-to-chord ratio
  if (bendCount <= 1 && atc < 1.08) return "gentle";
  if (bendCount === 0 && atc < 1.15) return "long";

  // ── Single prominent bend
  if (bendCount === 1) {
    if (maxAngle >= 70) return "shortElbow";   // tight 90°-ish turn
    if (maxAngle >= 45) return "elbow";         // moderate elbow
    return "wideArc";                           // one gentle sweep
  }

  // ── Two bends
  if (bendCount === 2) {
    // Z-routing: two bends that step the hose sideways (both moderate,
    // low total curvature relative to bend count).
    if (maxAngle < 55 && atc < 1.25) return "Zturn";
    // Deep S: two pronounced opposing bends.
    if (meanAngle >= 50 || atc >= 1.4) return "deepS";
    // Mild compound: two gentle bends.
    return "compound";
  }

  // ── Three+ bends
  if (bendCount >= 3) {
    // J-hook: one dominant bend + trailing small wiggles → treat as hook
    // if the max angle is much larger than the rest.
    if (maxAngle >= 60 && meanAngle < 45) return "hook";
    // High curvature with many bends → deep S or compound.
    if (atc >= 1.35) return "deepS";
    return "compound";
  }

  return "sweep";
}
