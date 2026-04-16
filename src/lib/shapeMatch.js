// Signature distance + polyline→signature computation for the bend
// builder (roadmap 10.3) and photo-of-wire matcher (10.4). Both surfaces
// produce a user-signature object with the same fields as the offline
// extractor writes into data/shape_signatures.json, so the matcher is
// symmetric: whatever created the user sketch is comparable to any
// catalogue hose that has a `shape`.
//
// Distance is a weighted sum of normalised differences. The weights are
// tuned so bend-count mismatches dominate (builders usually know *how
// many* bends their wire has with confidence, and angles are fuzzier).

/**
 * @typedef {{
 *   bendCount: number,
 *   bendAngles: number[],
 *   arcToChordRatio: number,
 *   polylinePointCount?: number,
 *   arcLenPx?: number,
 *   chordLenPx?: number,
 *   orientationDeg?: number,
 *   branchCount?: number,
 * }} Signature
 */

const BEND_COUNT_WEIGHT = 1.0;
const BEND_ANGLE_WEIGHT = 0.012;     // per-degree, summed across pairs
const ARC_RATIO_WEIGHT  = 1.4;
// Bend-count mismatch is usually the single strongest signal, so we add an
// extra flat penalty beyond the weighted diff whenever the counts differ.
const BEND_COUNT_DIFF_FLAT_PENALTY = 0.6;

/**
 * Distance between two signatures. 0 = identical; larger = more different.
 * Returns +Infinity if either input is missing required fields.
 * @param {Signature | null | undefined} a
 * @param {Signature | null | undefined} b
 * @returns {number}
 */
export function shapeDistance(a, b) {
  if (!a || !b) return Infinity;
  if (typeof a.bendCount !== "number" || typeof b.bendCount !== "number") return Infinity;
  if (typeof a.arcToChordRatio !== "number" || typeof b.arcToChordRatio !== "number") return Infinity;

  const bendCountDiff = Math.abs(a.bendCount - b.bendCount);
  const bendCountTerm = BEND_COUNT_WEIGHT * bendCountDiff
    + (bendCountDiff > 0 ? BEND_COUNT_DIFF_FLAT_PENALTY : 0);

  // Sort both angle arrays so order-independent comparison is fair.
  const aa = [...(a.bendAngles || [])].sort((x, y) => x - y);
  const bb = [...(b.bendAngles || [])].sort((x, y) => x - y);
  const n = Math.max(aa.length, bb.length);
  let angleTerm = 0;
  for (let i = 0; i < n; i++) {
    const aVal = aa[i] ?? 0;
    const bVal = bb[i] ?? 0;
    angleTerm += Math.abs(aVal - bVal);
  }
  angleTerm *= BEND_ANGLE_WEIGHT;

  const arcTerm = ARC_RATIO_WEIGHT * Math.abs(a.arcToChordRatio - b.arcToChordRatio);

  return bendCountTerm + angleTerm + arcTerm;
}

/**
 * Rank an array of hoses (each with `.shape`) by distance from `target`.
 * Hoses without a `shape` are filtered out. Result is sorted ascending and
 * capped at `limit`.
 * @param {Array<{partNo: string, shape?: Signature | null}>} hoses
 * @param {Signature | null} target
 * @param {number} [limit=12]
 * @returns {Array<{partNo: string, hose: any, distance: number}>}
 */
export function rankByShape(hoses, target, limit = 12) {
  if (!target) return [];
  const scored = [];
  for (const h of hoses) {
    if (!h.shape) continue;
    const d = shapeDistance(target, h.shape);
    if (!isFinite(d)) continue;
    scored.push({ partNo: h.partNo, hose: h, distance: d });
  }
  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, limit);
}

/**
 * Compute a Signature from a polyline (array of {x, y} points in any unit).
 * Applies the same bend-detection threshold as the offline extractor so
 * user sketches and catalogue signatures live in the same coordinate
 * system of "bends ≥ 25° off straight."
 *
 * @param {Array<{x: number, y: number}>} points
 * @param {{ bendThresholdDeg?: number }} [opts]
 * @returns {Signature | null}
 */
export function signatureFromPolyline(points, opts = {}) {
  const { bendThresholdDeg = 25.0 } = opts;
  if (!Array.isArray(points) || points.length < 2) return null;

  let arcLen = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    arcLen += Math.hypot(dx, dy);
  }
  const first = points[0];
  const last = points[points.length - 1];
  const chordLen = Math.hypot(last.x - first.x, last.y - first.y);
  if (arcLen <= 0) return null;
  const arcToChord = chordLen > 0 ? arcLen / chordLen : 0;
  const orientationDeg = Math.atan2(last.y - first.y, last.x - first.x) * 180 / Math.PI;

  const bendAngles = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const nxt = points[i + 1];
    const ax = prev.x - cur.x, ay = prev.y - cur.y;
    const bx = nxt.x - cur.x, by = nxt.y - cur.y;
    const la = Math.hypot(ax, ay);
    const lb = Math.hypot(bx, by);
    if (la === 0 || lb === 0) continue;
    const cos = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)));
    const interiorDeg = Math.acos(cos) * 180 / Math.PI;
    const deviation = 180 - interiorDeg;
    if (deviation >= bendThresholdDeg) {
      bendAngles.push(Math.round(deviation * 10) / 10);
    }
  }

  return {
    bendCount: bendAngles.length,
    bendAngles,
    arcLenPx: Math.round(arcLen * 100) / 100,
    chordLenPx: Math.round(chordLen * 100) / 100,
    arcToChordRatio: Math.round(arcToChord * 1000) / 1000,
    orientationDeg: Math.round(orientationDeg * 10) / 10,
    polylinePointCount: points.length,
    branchCount: 0,
  };
}
