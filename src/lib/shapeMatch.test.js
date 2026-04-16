import { describe, it, expect } from "vitest";
import { shapeDistance, rankByShape, signatureFromPolyline } from "./shapeMatch.js";

const STRAIGHT = { bendCount: 0, bendAngles: [], arcToChordRatio: 1.02 };
const GENTLE   = { bendCount: 1, bendAngles: [28],      arcToChordRatio: 1.14 };
const ELBOW    = { bendCount: 1, bendAngles: [85],      arcToChordRatio: 1.22 };
const S_BEND   = { bendCount: 2, bendAngles: [55, 52],  arcToChordRatio: 1.35 };
const COILED   = { bendCount: 8, bendAngles: [70, 65, 60, 55, 50, 45, 40, 35], arcToChordRatio: 4.5 };

describe("shapeDistance", () => {
  it("returns 0 when signatures are identical", () => {
    expect(shapeDistance(STRAIGHT, STRAIGHT)).toBe(0);
    expect(shapeDistance(ELBOW, { ...ELBOW })).toBe(0);
  });

  it("returns +Infinity for missing inputs", () => {
    expect(shapeDistance(null, STRAIGHT)).toBe(Infinity);
    expect(shapeDistance(STRAIGHT, null)).toBe(Infinity);
    expect(shapeDistance({}, STRAIGHT)).toBe(Infinity);
  });

  it("penalises bendCount mismatch more than angle drift", () => {
    // STRAIGHT vs GENTLE: 1 bend-count diff
    const straightVsGentle = shapeDistance(STRAIGHT, GENTLE);
    // GENTLE vs ELBOW: same bend count, angles differ
    const gentleVsElbow = shapeDistance(GENTLE, ELBOW);
    expect(straightVsGentle).toBeGreaterThan(gentleVsElbow);
  });

  it("puts similar shapes closer than dissimilar ones", () => {
    const gentleVsElbow = shapeDistance(GENTLE, ELBOW);
    const gentleVsCoiled = shapeDistance(GENTLE, COILED);
    expect(gentleVsElbow).toBeLessThan(gentleVsCoiled);
  });

  it("is symmetric", () => {
    expect(shapeDistance(GENTLE, S_BEND)).toBeCloseTo(shapeDistance(S_BEND, GENTLE), 6);
  });

  it("treats bendAngle order as irrelevant", () => {
    const a = { bendCount: 3, bendAngles: [30, 60, 90], arcToChordRatio: 1.3 };
    const b = { bendCount: 3, bendAngles: [90, 30, 60], arcToChordRatio: 1.3 };
    expect(shapeDistance(a, b)).toBe(0);
  });
});

describe("rankByShape", () => {
  const HOSES = [
    { partNo: "A", shape: STRAIGHT },
    { partNo: "B", shape: GENTLE },
    { partNo: "C", shape: ELBOW },
    { partNo: "D", shape: S_BEND },
    { partNo: "E", shape: COILED },
    { partNo: "F" },                 // missing shape — should be filtered
    { partNo: "G", shape: null },
  ];

  it("ranks hoses by distance to target", () => {
    const ranked = rankByShape(HOSES, STRAIGHT);
    expect(ranked[0].partNo).toBe("A");        // perfect match
    expect(ranked[0].distance).toBe(0);
    expect(ranked[ranked.length - 1].partNo).toBe("E"); // coiled is farthest
  });

  it("drops hoses without a shape signature", () => {
    const ranked = rankByShape(HOSES, STRAIGHT);
    const parts = ranked.map((r) => r.partNo);
    expect(parts).not.toContain("F");
    expect(parts).not.toContain("G");
  });

  it("honours the limit argument", () => {
    const ranked = rankByShape(HOSES, STRAIGHT, 2);
    expect(ranked).toHaveLength(2);
  });

  it("returns empty array when target is null", () => {
    expect(rankByShape(HOSES, null)).toEqual([]);
  });
});

describe("signatureFromPolyline", () => {
  it("returns null for insufficient points", () => {
    expect(signatureFromPolyline([])).toBe(null);
    expect(signatureFromPolyline([{ x: 0, y: 0 }])).toBe(null);
  });

  it("produces bendCount=0 for a straight line", () => {
    const sig = signatureFromPolyline([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(sig.bendCount).toBe(0);
    expect(sig.arcToChordRatio).toBeCloseTo(1, 3);
  });

  it("produces bendCount=1 for a right-angle corner", () => {
    const sig = signatureFromPolyline([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(sig.bendCount).toBe(1);
    // Deviation from straight at the corner is 90°.
    expect(sig.bendAngles[0]).toBeCloseTo(90, 0);
    // arc = 200, chord = √(100² + 100²) ≈ 141.42, ratio ≈ 1.414
    expect(sig.arcToChordRatio).toBeCloseTo(1.414, 2);
  });

  it("ignores bends below the threshold", () => {
    // Gentle zig-zag where each deviation is ~5° — below 25° threshold.
    const sig = signatureFromPolyline([
      { x: 0, y: 0 },
      { x: 100, y: 5 },
      { x: 200, y: 0 },
      { x: 300, y: 5 },
      { x: 400, y: 0 },
    ]);
    expect(sig.bendCount).toBe(0);
  });

  it("sketches round-trip through distance", () => {
    const straight = signatureFromPolyline([
      { x: 0, y: 0 }, { x: 100, y: 0 },
    ]);
    const elbow = signatureFromPolyline([
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 },
    ]);
    // A sketched elbow should be closer to the ELBOW catalog sig than to STRAIGHT.
    expect(shapeDistance(elbow, ELBOW)).toBeLessThan(shapeDistance(elbow, STRAIGHT));
    expect(shapeDistance(straight, STRAIGHT)).toBeLessThan(shapeDistance(straight, ELBOW));
  });
});
