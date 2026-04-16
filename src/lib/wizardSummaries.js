// Pure string builders for the "completed step" summary strips the wizard
// collapses to once the user advances. Each one takes primitive state (no
// React, no context) and returns the exact string the strip renders.
// Kept locale-agnostic for now — the strings are still hardcoded English;
// when the i18n sweep lands (roadmap 8.5) this file will thread `t()` in.

/** @type {readonly {key: "single"|"reducer"|"branched", title: string, body: string, chip: string, silhouette: string}[]} */
export const FLOW_CARDS = [
  { key: "single",   title: "Same-size", body: "Both ends match. Clean neck-to-neck runs.",        chip: "1 size",   silhouette: "wideArc" },
  { key: "reducer",  title: "Reducer",   body: "Two different end diameters. Swaps and adapters.", chip: "2 sizes",  silhouette: "Zturn"  },
  { key: "branched", title: "Branched",  body: "Bypass or auxiliary lines. Three or more ends.",   chip: "3–4 ends", silhouette: "branchY" },
];

/**
 * @param {string} flow
 * @returns {string}
 */
export function flowSummary(flow) {
  if (flow === "single")   return "Type: Same-size";
  if (flow === "reducer")  return "Type: Reducer";
  if (flow === "branched") return "Type: Branched";
  return "";
}

/**
 * @param {string} targetId1
 * @param {string} targetId2
 * @returns {string}
 */
export function sizeSummary(targetId1, targetId2) {
  if (!targetId1 && !targetId2) return "";
  const parts = [];
  if (targetId1) parts.push(`End 1: ${targetId1}"`);
  if (targetId2) parts.push(`End 2: ${targetId2}"`);
  return parts.join(" · ");
}

/**
 * @param {string} targetLen
 * @param {number} lenTol — tolerance in inches, 99 means "any"
 * @returns {string}
 */
export function lengthSummary(targetLen, lenTol) {
  const any = lenTol >= 99;
  if (!targetLen) return any ? "Length: Any route length" : "";
  if (any) return `Length: ${targetLen}" · any tolerance`;
  return `Length: ${targetLen}" ±${lenTol.toFixed(1)}"`;
}
