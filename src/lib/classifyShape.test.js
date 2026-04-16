import { describe, it, expect } from "vitest";
import { classifyShape } from "./classifyShape.js";

describe("classifyShape", () => {
  it("classifies truly straight hoses as gentle", () => {
    expect(classifyShape({ bendCount: 0, bendAngles: [], arcToChordRatio: 1.02 }))
      .toBe("gentle");
  });

  it("classifies low-bend, low-arc hoses as long", () => {
    expect(classifyShape({ bendCount: 0, bendAngles: [], arcToChordRatio: 1.10 }))
      .toBe("long");
  });

  it("classifies a single sharp bend as shortElbow", () => {
    expect(classifyShape({ bendCount: 1, bendAngles: [85], arcToChordRatio: 1.3 }))
      .toBe("shortElbow");
  });

  it("classifies a single moderate bend as elbow", () => {
    expect(classifyShape({ bendCount: 1, bendAngles: [50], arcToChordRatio: 1.2 }))
      .toBe("elbow");
  });

  it("classifies a single gentle bend as wideArc", () => {
    expect(classifyShape({ bendCount: 1, bendAngles: [30], arcToChordRatio: 1.15 }))
      .toBe("wideArc");
  });

  it("classifies two moderate bends with low arc as Zturn", () => {
    expect(classifyShape({ bendCount: 2, bendAngles: [40, 38], arcToChordRatio: 1.18 }))
      .toBe("Zturn");
  });

  it("classifies two pronounced bends as deepS", () => {
    expect(classifyShape({ bendCount: 2, bendAngles: [65, 60], arcToChordRatio: 1.5 }))
      .toBe("deepS");
  });

  it("classifies two mild bends as compound", () => {
    expect(classifyShape({ bendCount: 2, bendAngles: [35, 40], arcToChordRatio: 1.28 }))
      .toBe("compound");
  });

  it("classifies 3+ bends with one dominant as hook", () => {
    expect(classifyShape({ bendCount: 3, bendAngles: [70, 30, 25], arcToChordRatio: 1.2 }))
      .toBe("hook");
  });

  it("classifies 3+ bends with high curvature as deepS", () => {
    expect(classifyShape({ bendCount: 4, bendAngles: [50, 55, 45, 50], arcToChordRatio: 1.4 }))
      .toBe("deepS");
  });

  it("preserves branched classification by endCount", () => {
    expect(classifyShape(null, { hoseType: "branched", endCount: 3 })).toBe("branchY");
    expect(classifyShape(null, { hoseType: "branched", endCount: 4 })).toBe("branchFour");
    expect(classifyShape(null, { hoseType: "branched", endCount: 2 })).toBe("branch");
  });

  it("falls back to sweep when shape is null", () => {
    expect(classifyShape(null)).toBe("sweep");
    expect(classifyShape(undefined)).toBe("sweep");
  });

  it("correctly reclassifies 21478 (was wrongly gentle)", () => {
    const sig = {
      bendCount: 3,
      bendAngles: [28.4, 34.9, 41.8],
      arcToChordRatio: 1.13,
    };
    const result = classifyShape(sig);
    expect(result).not.toBe("gentle");
    expect(result).not.toBe("long");
  });
});
