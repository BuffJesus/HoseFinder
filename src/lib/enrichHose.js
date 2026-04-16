// Data enrichment pipeline. Takes a raw hose row from `data/hoses.json`
// and adds derived fields: endSizes[], endCount, hoseType, sizeBand,
// silhouette, tags[], visualFamily, images[]. The rest of the app reads
// only the enriched shape.

/**
 * @typedef {{
 *   partNo: string,
 *   hoseId: string,
 *   length: number,
 *   rowNo: number,
 *   idMin?: number,
 *   idMax?: number,
 *   catalogPage?: number,
 *   familyLabel?: string,
 * }} RawHose
 */

/** Human labels for each sizeBand key — surfaced in the detail modal + compare. */
export const SIZE_BAND_LABELS = {
  "bypass":         "Bypass / micro (< 0.4\")",
  "heater-small":   "Heater — small (0.4–0.64\")",
  "heater-mid":     "Heater — mid (0.65–0.89\")",
  "heater-large":   "Heater — large (0.9–1.19\")",
  "radiator-small": "Radiator — small (1.2–1.49\")",
  "radiator-mid":   "Radiator — mid (1.5–1.89\")",
  "radiator-large": "Radiator — large (1.9–2.49\")",
  "radiator-xl":    "Radiator — XL (2.5\"+)",
};

/** Application label per sizeBand, used to compose visualFamily strings. */
export const APPLICATION_LABELS = {
  "bypass":         "Bypass line",
  "heater-small":   "Heater hose",
  "heater-mid":     "Heater / bypass",
  "heater-large":   "Heater / degas",
  "radiator-small": "Lower radiator",
  "radiator-mid":   "Upper/lower radiator",
  "radiator-large": "Large radiator",
  "radiator-xl":    "Heavy-duty radiator",
};

/** Silhouette → short human name, used in visualFamily. */
export const SHAPE_LABELS = {
  sweep:      "S-curve",
  elbow:      "elbow",
  compound:   "compound S",
  long:       "long sweep",
  hook:       "J-hook",
  gentle:     "gentle curve",
  Zturn:      "Z-routing",
  shortElbow: "tight elbow",
  deepS:      "deep S",
  wideArc:    "wide arc",
  branch:     "T-branch",
  branchY:    "Y-branch",
  branchFour: "4-way branch",
};

// Deterministic silhouette picker — keyed by rowNo so the same hose always
// renders the same silhouette across re-renders.
const SILHOUETTE_POOL = [
  "sweep", "elbow", "compound", "long", "hook",
  "gentle", "Zturn", "shortElbow", "deepS", "wideArc",
];

/** @param {number} rowNo @param {string} hoseType @param {number} endCount */
export function getSilhouetteType(rowNo, hoseType, endCount) {
  if (hoseType === "branched") return endCount >= 4 ? "branchFour" : endCount >= 3 ? "branchY" : "branch";
  return SILHOUETTE_POOL[rowNo % SILHOUETTE_POOL.length];
}

/** @param {string} sizeBand @param {string} silhouette @param {string} hoseType */
export function getShapeLabel(sizeBand, silhouette, hoseType) {
  const app = APPLICATION_LABELS[sizeBand] || "Coolant hose";
  const shape = SHAPE_LABELS[silhouette] || "curve";
  const prefix = hoseType === "reducer"  ? "Reducer · "
               : hoseType === "branched" ? "Branched · "
               : "";
  return `${prefix}${app} · ${shape}`;
}

/**
 * @param {RawHose} h
 * @returns {RawHose & {
 *   endSizes: number[],
 *   endCount: number,
 *   hoseType: "single"|"reducer"|"branched",
 *   sizeBand: string,
 *   silhouette: string,
 *   tags: string[],
 *   visualFamily: string,
 *   images: string[],
 * }}
 */
export function enrichHose(h) {
  const parts = h.hoseId.split(" X ").map(Number).filter((n) => !isNaN(n));
  const endCount = parts.length;
  const hoseType = endCount === 1 ? "single" : endCount === 2 ? "reducer" : "branched";
  const primaryId = parts.length ? Math.max(...parts) : 0;

  let sizeBand;
  if (primaryId < 0.4)        sizeBand = "bypass";
  else if (primaryId < 0.65)  sizeBand = "heater-small";
  else if (primaryId < 0.9)   sizeBand = "heater-mid";
  else if (primaryId < 1.2)   sizeBand = "heater-large";
  else if (primaryId < 1.5)   sizeBand = "radiator-small";
  else if (primaryId < 1.9)   sizeBand = "radiator-mid";
  else if (primaryId < 2.5)   sizeBand = "radiator-large";
  else                         sizeBand = "radiator-xl";

  const silhouette = getSilhouetteType(h.rowNo, hoseType, endCount);

  const tags = [];
  if (hoseType === "single")   tags.push("same-size");
  if (hoseType === "reducer")  tags.push("reducer", "two-end");
  if (hoseType === "branched") tags.push("branched", `${endCount}-ends`);
  if (h.length < 8)            tags.push("compact");
  else if (h.length > 30)      tags.push("long");
  tags.push(sizeBand.replace("heater-", "heater ").replace("radiator-", "radiator "));

  const visualFamily = h.familyLabel || getShapeLabel(sizeBand, silhouette, hoseType);

  return {
    ...h,
    endSizes: parts,
    endCount,
    hoseType,
    sizeBand,
    silhouette,
    tags,
    visualFamily,
    images: ["silhouette", "catalog"],
  };
}
