// Shape-similarity scoring. Given two enriched hoses, returns a 0..1 score
// plus the specific reasons it arrived at that score, weight-ordered so the
// UI can show the two strongest reasons. Every match is explainable in one
// sentence — no black-box ranking.

import { CURVATURE_BY_SIL, LENGTH_CLASSES, STEP_RATIOS, reducerStepRatio } from "./shapeBuckets.js";

/**
 * @typedef {{
 *   partNo: string,
 *   silhouette?: string,
 *   hoseType?: string,
 *   sizeBand?: string,
 *   length?: number,
 *   endSizes?: number[],
 *   catalogPage?: number,
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

  if (a.silhouette === b.silhouette) {
    score += 0.50;
    reasons.push({ label: "same silhouette", weight: 0.50 });
  } else if (a.hoseType === b.hoseType) {
    score += 0.15;
    reasons.push({ label: `same ${a.hoseType} type`, weight: 0.15 });
  }

  const ga = CURVATURE_BY_SIL[a.silhouette];
  const gb = CURVATURE_BY_SIL[b.silhouette];
  if (ga && gb && ga === gb && a.silhouette !== b.silhouette) {
    score += 0.20;
    reasons.push({ label: "matching curvature", weight: 0.20 });
  }

  if (a.hoseType === "reducer" && b.hoseType === "reducer") {
    const ra = reducerStepRatio(a);
    const rb = reducerStepRatio(b);
    if (ra != null && rb != null) {
      const bucketA = STEP_RATIOS.find((x) => x.match(ra));
      const bucketB = STEP_RATIOS.find((x) => x.match(rb));
      if (bucketA && bucketB && bucketA.key === bucketB.key) {
        score += 0.15;
        reasons.push({ label: `${bucketA.label.toLowerCase()} step`, weight: 0.15 });
      }
    }
  }

  const la = LENGTH_CLASSES.find((c) => c.match(a.length));
  const lb = LENGTH_CLASSES.find((c) => c.match(b.length));
  if (la && lb && la.key === lb.key) {
    score += 0.10;
    reasons.push({ label: `${la.label.toLowerCase()} length`, weight: 0.10 });
  }

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
