import { describe, it, expect } from "vitest";
import { shapeSimilarity, findSimilarHoses } from "./similarity.js";

const hose = (overrides) => ({
  partNo: "00000",
  silhouette: "sweep",
  hoseType: "single",
  sizeBand: "radiator-mid",
  length: 18,
  endSizes: [1.5],
  catalogPage: 100,
  ...overrides,
});

describe("shapeSimilarity", () => {
  it("returns 0 for the same part", () => {
    const a = hose({ partNo: "24183" });
    expect(shapeSimilarity(a, a).score).toBe(0);
  });

  it("returns 0 for null inputs", () => {
    expect(shapeSimilarity(null, hose()).score).toBe(0);
    expect(shapeSimilarity(hose(), null).score).toBe(0);
  });

  it("identical shape family scores well (fallback path, no shape data)", () => {
    const a = hose({ partNo: "1" });
    const b = hose({ partNo: "2" });
    const { score, reasons } = shapeSimilarity(a, b);
    // same silhouette 0.30 + curvature 0.10 + length 0.10 + size band 0.05 = 0.55
    expect(score).toBeCloseTo(0.55);
    expect(reasons[0].label).toBe("same shape family");
  });

  it("hoses with real shape data use geometric distance", () => {
    const shape = { bendCount: 1, bendAngles: [60], arcToChordRatio: 1.2 };
    const a = hose({ partNo: "1", shape });
    const b = hose({ partNo: "2", shape });
    const { score, reasons } = shapeSimilarity(a, b);
    expect(score).toBeGreaterThan(0.7);
    expect(reasons[0].label).toBe("very similar shape");
  });

  it("different silhouette but same curvature group scores medium", () => {
    const a = hose({ partNo: "1", silhouette: "elbow" });
    const b = hose({ partNo: "2", silhouette: "shortElbow" });
    const { score, reasons } = shapeSimilarity(a, b);
    // same hoseType 0.10 + matching curvature 0.10 + length 0.10 + size band 0.05 = 0.35
    expect(score).toBeCloseTo(0.35);
    expect(reasons.some((r) => r.label === "matching curvature")).toBe(true);
  });

  it("reducers with matching step ratio add weight", () => {
    const a = hose({
      partNo: "1", hoseType: "reducer", silhouette: "elbow",
      endSizes: [1.5, 1.75], sizeBand: "radiator-mid",
    });
    const b = hose({
      partNo: "2", hoseType: "reducer", silhouette: "shortElbow",
      endSizes: [1.6, 1.8], sizeBand: "radiator-mid",
    });
    const { score, reasons } = shapeSimilarity(a, b);
    expect(reasons.some((r) => r.label.endsWith("step"))).toBe(true);
    expect(score).toBeGreaterThan(0.35);
  });

  it("reasons are sorted by descending weight", () => {
    const a = hose({ partNo: "1" });
    const b = hose({ partNo: "2" });
    const { reasons } = shapeSimilarity(a, b);
    for (let i = 1; i < reasons.length; i++) {
      expect(reasons[i - 1].weight).toBeGreaterThanOrEqual(reasons[i].weight);
    }
  });
});

describe("findSimilarHoses", () => {
  const catalog = [
    hose({ partNo: "a", silhouette: "sweep",      catalogPage: 10 }),
    hose({ partNo: "b", silhouette: "sweep",      catalogPage: 20 }),
    hose({ partNo: "c", silhouette: "shortElbow", catalogPage: 30, sizeBand: "heater-mid", length: 4 }),
    hose({ partNo: "d", silhouette: "hook",       catalogPage: 40, sizeBand: "bypass",    length: 3 }),
  ];

  it("excludes the target itself", () => {
    const target = hose({ partNo: "a" });
    const out = findSimilarHoses(target, catalog);
    expect(out.every((r) => r.hose.partNo !== "a")).toBe(true);
  });

  it("sorts by score descending, then catalog page ascending", () => {
    const target = hose({ partNo: "a" });
    const out = findSimilarHoses(target, catalog);
    // 'b' shares silhouette (highest score) — strongest
    expect(out[0].hose.partNo).toBe("b");
  });

  it("filters out candidates below minScore", () => {
    const target = hose({ partNo: "a" });
    // Use a high minScore that only the strongest match can clear
    const out = findSimilarHoses(target, catalog, { minScore: 0.5 });
    expect(out.every((r) => r.score >= 0.5)).toBe(true);
  });

  it("respects the limit", () => {
    const target = hose({ partNo: "a" });
    const many = Array.from({ length: 20 }, (_, i) =>
      hose({ partNo: `p${i}`, silhouette: "sweep", catalogPage: 100 + i }),
    );
    const out = findSimilarHoses(target, many, { limit: 5 });
    expect(out.length).toBe(5);
  });

  it("returns [] for null target", () => {
    expect(findSimilarHoses(null, catalog)).toEqual([]);
  });
});
