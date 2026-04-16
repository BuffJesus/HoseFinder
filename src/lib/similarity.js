// Shape-similarity scoring. Given two enriched hoses, returns a 0..1 score
// plus the specific reasons it arrived at that score, weight-ordered so the
// UI can show the two strongest reasons. Every match is explainable in one
// sentence — no black-box ranking.
//
// When both hoses carry a `shape` signature (from the offline extractor),
// similarity is driven by real geometric distance: bend count, bend angles,
// arc-to-chord ratio. This replaced the old bucket-only approach that put
// 2,500 hoses in the same "compound" silhouette bucket and called them all
// "same silhouette."
//
// Bucket-matching (curvature group, length class, step ratio, size band)
// still contributes as a tiebreaker and as the primary signal when shape
// data is missing.

import { CURVATURE_BY_SIL, LENGTH_CLASSES, STEP_RATIOS, reducerStepRatio } from "./shapeBuckets.js";
import { shapeDistance } from "./shapeMatch.js";

/**
 * @typedef {{
 *   partNo: string,
 *   silhouette?: string,
 *   hoseType?: string,
 *   sizeBand?: string,
 *   length?: number,
 *   endSizes?: number[],
 *   catalogPage?: number,
 *   shape?: import("./shapeMatch.js").Signature | null,
 * }} HoseLike
 *
 * @typedef {{ label: string, weight: number }} Reason
 * @typedef {{ score: number, reasons: Reason[] }} Similarity
 */

/**
 * @param {HoseLike|null|undefined} a
 * @param {HoseLike|null|undefined} b
 * @returns {Similarity}
 */
export function shapeSimilarity(a, b) {
  if (!a || !b || a.partNo === b.partNo) return { score: 0, reasons: [] };
  /** @type {Reason[]} */
  const reasons = [];
  let score = 0;

  // ── Primary: real geometric distance (when both have shape data) ──
  const dist = shapeDistance(a.shape, b.shape);
  if (isFinite(dist)) {
    // Convert distance to a 0–1 similarity score. Distances typically
    // range from 0 (identical) to ~15 (completely different). Map through
    // a soft sigmoid so small differences still produce high scores.
    const geoScore = Math.max(0, 1 - dist / 8);
    score += geoScore * 0.65;
    if (geoScore >= 0.8) {
      reasons.push({ label: "very similar shape", weight: 0.65 });
    } else if (geoScore >= 0.5) {
      reasons.push({ label: "similar shape", weight: 0.45 });
    } else if (geoScore >= 0.25) {
      reasons.push({ label: "related shape", weight: 0.25 });
    }
  } else {
    // Fallback: bucket matching when shape data is missing.
    if (a.silhouette === b.silhouette) {
      score += 0.30;
      reasons.push({ label: "same shape family", weight: 0.30 });
    } else if (a.hoseType === b.hoseType) {
      score += 0.10;
      reasons.push({ label: `same ${a.hoseType} type`, weight: 0.10 });
    }
  }

  // ── Secondary: curvature group match ──
  const ga = CURVATURE_BY_SIL[a.silhouette];
  const gb = CURVATURE_BY_SIL[b.silhouette];
  if (ga && gb && ga === gb) {
    score += 0.10;
    reasons.push({ label: "matching curvature", weight: 0.10 });
  }

  // ── Secondary: reducer step ratio ──
  if (a.hoseType === "reducer" && b.hoseType === "reducer") {
    const ra = reducerStepRatio(a);
    const rb = reducerStepRatio(b);
    if (ra != null && rb != null) {
      const bucketA = STEP_RATIOS.find((x) => x.match(ra));
      const bucketB = STEP_RATIOS.find((x) => x.match(rb));
      if (bucketA && bucketB && bucketA.key === bucketB.key) {
        score += 0.10;
        reasons.push({ label: `${bucketA.label.toLowerCase()} step`, weight: 0.10 });
      }
    }
  }

  // ── Tertiary: length class ──
  const la = LENGTH_CLASSES.find((c) => c.match(a.length));
  const lb = LENGTH_CLASSES.find((c) => c.match(b.length));
  if (la && lb && la.key === lb.key) {
    score += 0.10;
    reasons.push({ label: `${la.label.toLowerCase()} length`, weight: 0.10 });
  }

  // ── Tertiary: size band ──
  if (a.sizeBand && a.sizeBand === b.sizeBand) {
    score += 0.05;
    reasons.push({ label: "same size band", weight: 0.05 });
  }

  reasons.sort((x, y) => y.weight - x.weight);
  return { score: Math.min(1, score), reasons };
}

/**
 * @param {HoseLike|null|undefined} target
 * @param {HoseLike[]} allHoses
 * @param {{ limit?: number, minScore?: number }} [opts]
 * @returns {Array<{ hose: HoseLike } & Similarity>}
 */
export function findSimilarHoses(target, allHoses, { limit = 8, minScore = 0.15 } = {}) {
  if (!target) return [];
  const scored = allHoses
    .filter((h) => h.partNo !== target.partNo)
    .map((h) => {
      const sim = shapeSimilarity(target, h);
      return sim.score >= minScore ? { hose: h, ...sim } : null;
    })
    .filter(Boolean);
  scored.sort(
    (a, b) => b.score - a.score || (a.hose.catalogPage || 0) - (b.hose.catalogPage || 0),
  );
  return scored.slice(0, limit);
}
