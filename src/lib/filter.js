// scoreAndFilter — the single hose-matcher the UI layers everything on top
// of. Given an enriched hose and a filter-param bag, returns either:
//   - null  (hose excluded by a hard filter or out-of-tolerance)
//   - { ...hose, _score, _matchQuality, _gap }
//
// Scoring is 0..1. Gap is a per-axis breakdown the detail modal surfaces to
// explain *how close* a near-match is.

import {
  CURVATURE_BY_SIL, LENGTH_CLASS_BY_KEY, STEP_RATIOS, reducerStepRatio,
} from "./shapeBuckets.js";

/**
 * @typedef {{
 *   partNo: string,
 *   hoseId: string,
 *   hoseType: string,
 *   silhouette: string,
 *   sizeBand: string,
 *   length: number,
 *   endCount: number,
 *   endSizes: number[],
 *   visualFamily: string,
 *   tags: string[],
 * }} EnrichedHose
 *
 * @typedef {{
 *   targetId1: string, targetId2: string, targetLen: string,
 *   idTol: number, lenTol: number,
 *   hoseTypeFilter: string, sizeBandFilter: string, endCountFilter: string,
 *   flow: string, search: string,
 *   curvature?: Set<string>, lengthClass?: Set<string>,
 *   stepRatio?: Set<string>, silhouettes?: Set<string>,
 * }} FilterParams
 *
 * @typedef {{
 *   idDelta: number, lenDelta: number,
 *   idExact: boolean, lenExact: boolean,
 *   idHasTgt: boolean, lenHasTgt: boolean,
 *   idDir: "larger"|"smaller"|"exact"|null,
 *   lenDir: "longer"|"shorter"|"exact"|null,
 * }} Gap
 *
 * @typedef {"exact"|"close"|"approx"|null} MatchQuality
 */

/**
 * @param {EnrichedHose} hose
 * @param {FilterParams} params
 * @returns {null | (EnrichedHose & { _score: number, _matchQuality: MatchQuality, _gap: Gap|null })}
 */
export function scoreAndFilter(hose, {
  targetId1, targetId2, targetLen, idTol, lenTol,
  hoseTypeFilter, sizeBandFilter, endCountFilter,
  flow, search,
  curvature, lengthClass, stepRatio, silhouettes,
}) {
  if (flow !== "all" && hose.hoseType !== flow) return null;
  if (hoseTypeFilter !== "all" && hose.hoseType !== hoseTypeFilter) return null;
  if (sizeBandFilter !== "all" && hose.sizeBand !== sizeBandFilter) return null;
  if (endCountFilter !== "all" && String(hose.endCount) !== endCountFilter) return null;

  if (curvature && curvature.size > 0) {
    const grp = CURVATURE_BY_SIL[hose.silhouette];
    if (!grp || !curvature.has(grp)) return null;
  }
  if (silhouettes && silhouettes.size > 0) {
    if (!silhouettes.has(hose.silhouette)) return null;
  }
  if (lengthClass && lengthClass.size > 0) {
    let hit = false;
    for (const k of lengthClass) {
      const c = LENGTH_CLASS_BY_KEY[k];
      if (c && c.match(hose.length)) { hit = true; break; }
    }
    if (!hit) return null;
  }
  if (stepRatio && stepRatio.size > 0) {
    const r = reducerStepRatio(hose);
    if (r === null) return null;
    let hit = false;
    for (const k of stepRatio) {
      const s = STEP_RATIOS.find((x) => x.key === k);
      if (s && s.match(r)) { hit = true; break; }
    }
    if (!hit) return null;
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    const hit = hose.partNo.toLowerCase().includes(q)
      || hose.hoseId.toLowerCase().includes(q)
      || hose.visualFamily.toLowerCase().includes(q)
      || hose.tags.join(" ").includes(q)
      || hose.hoseType.includes(q);
    if (!hit) return null;
  }

  let idScore = 0;
  let lenScore = 0;
  let idPenalty = 0;
  let lenPenalty = 0;

  if (targetId1 !== "") {
    const t1 = parseFloat(targetId1);
    if (!isNaN(t1)) {
      if (!hose.endSizes.length) return null;
      const best = Math.min(...hose.endSizes.map((s) => Math.abs(s - t1)));
      if (best > idTol) return null;
      idScore = 1 - best / idTol;
      idPenalty = best;
    }
  }

  if (targetId2 !== "" && hose.endCount >= 2) {
    const t2 = parseFloat(targetId2);
    if (!isNaN(t2)) {
      const t1v = parseFloat(targetId1) || 0;
      const others = hose.endSizes.length > 1
        ? hose.endSizes.filter((s) => Math.abs(s - t1v) > 0.02)
        : hose.endSizes;
      const pool = others.length ? others : hose.endSizes;
      if (!pool.length) return null;
      const best2 = Math.min(...pool.map((s) => Math.abs(s - t2)));
      if (best2 > idTol) return null;
      idScore = (idScore + (1 - best2 / idTol)) / 2;
      idPenalty += best2;
    }
  } else if (targetId2 !== "" && hose.endCount < 2) {
    return null; // needs two ends
  }

  if (targetLen !== "") {
    const tLen = parseFloat(targetLen);
    if (!isNaN(tLen)) {
      const diff = Math.abs(hose.length - tLen);
      if (diff > lenTol) return null;
      lenScore = 1 - diff / lenTol;
      lenPenalty = diff;
    }
  }

  const hasFilters = targetId1 !== "" || targetLen !== "";
  const totalScore = hasFilters ? (idScore + lenScore) / 2 : 1;

  /** @type {MatchQuality} */
  let matchQuality = null;
  if (hasFilters) {
    if (idPenalty < 0.03 && lenPenalty < 0.5) matchQuality = "exact";
    else if (totalScore > 0.7)                 matchQuality = "close";
    else                                        matchQuality = "approx";
  }

  const t1Num = parseFloat(targetId1);
  const tLenNum = parseFloat(targetLen);
  const idHasTgt = targetId1 !== "" && !isNaN(t1Num);
  const lenHasTgt = targetLen !== "" && !isNaN(tLenNum);
  /** @type {"larger"|"smaller"|"exact"|null} */
  let idDir = null;
  if (idHasTgt && hose.endSizes.length) {
    const nearest = hose.endSizes.reduce(
      (a, b) => (Math.abs(b - t1Num) < Math.abs(a - t1Num) ? b : a),
    );
    idDir = nearest > t1Num ? "larger" : nearest < t1Num ? "smaller" : "exact";
  }
  /** @type {"longer"|"shorter"|"exact"|null} */
  const lenDir = lenHasTgt
    ? (hose.length > tLenNum ? "longer" : hose.length < tLenNum ? "shorter" : "exact")
    : null;

  /** @type {Gap|null} */
  const gap = hasFilters ? {
    idDelta: idPenalty,
    lenDelta: lenPenalty,
    idExact: idHasTgt && idPenalty < 0.02,
    lenExact: lenHasTgt && lenPenalty < 0.5,
    idHasTgt,
    lenHasTgt,
    idDir,
    lenDir,
  } : null;

  return { ...hose, _score: totalScore, _matchQuality: matchQuality, _gap: gap };
}

/**
 * Convenience — a neutral set of filter params used when a helper needs
 * scoreAndFilter to run as "no filters applied except X." Callers can spread
 * this object, then override the specific fields they want active.
 */
/** @type {FilterParams} */
export const NO_FILTERS = Object.freeze({
  targetId1: "", targetId2: "", targetLen: "",
  idTol: 0.06, lenTol: 2.0,
  hoseTypeFilter: "all", sizeBandFilter: "all", endCountFilter: "all",
  flow: "all", search: "",
  curvature: new Set(), lengthClass: new Set(),
  stepRatio: new Set(), silhouettes: new Set(),
});
