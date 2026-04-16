import { describe, it, expect } from "vitest";
import {
  STEP_RATIOS, LENGTH_CLASSES, LENGTH_CLASS_BY_KEY,
  CURVATURE_GROUPS, CURVATURE_BY_SIL, reducerStepRatio,
} from "./shapeBuckets.js";

describe("reducerStepRatio", () => {
  it("returns null for single-end hoses", () => {
    expect(reducerStepRatio({ endSizes: [1.5] })).toBe(null);
    expect(reducerStepRatio({ endSizes: [] })).toBe(null);
    expect(reducerStepRatio({})).toBe(null);
  });
  it("returns max/min for two-end reducers", () => {
    expect(reducerStepRatio({ endSizes: [1.5, 1.75] })).toBeCloseTo(1.75 / 1.5);
  });
  it("ignores zero/negative ends on the min side", () => {
    expect(reducerStepRatio({ endSizes: [0, 1.5, 2.0] })).toBeCloseTo(2.0 / 1.5);
  });
});

describe("STEP_RATIOS buckets", () => {
  it("partition ratios into small/medium/large", () => {
    expect(STEP_RATIOS[0].match(1.1)).toBe(true);   // small
    expect(STEP_RATIOS[0].match(1.5)).toBe(false);
    expect(STEP_RATIOS[1].match(1.5)).toBe(true);   // medium
    expect(STEP_RATIOS[2].match(2.0)).toBe(true);   // large
  });
});

describe("LENGTH_CLASSES buckets", () => {
  it("bucket a 4\" stub correctly", () => {
    const bucket = LENGTH_CLASSES.find((c) => c.match(4));
    expect(bucket.key).toBe("stub");
  });
  it("bucket a 10\" short correctly", () => {
    const bucket = LENGTH_CLASSES.find((c) => c.match(10));
    expect(bucket.key).toBe("short");
  });
  it("bucket a 24\" long correctly", () => {
    const bucket = LENGTH_CLASSES.find((c) => c.match(24));
    expect(bucket.key).toBe("long");
  });
  it("LENGTH_CLASS_BY_KEY mirrors LENGTH_CLASSES", () => {
    for (const c of LENGTH_CLASSES) expect(LENGTH_CLASS_BY_KEY[c.key]).toBe(c);
  });
});

describe("CURVATURE_BY_SIL", () => {
  it("maps each silhouette type to its parent group", () => {
    for (const group of CURVATURE_GROUPS) {
      for (const type of group.types) {
        expect(CURVATURE_BY_SIL[type]).toBe(group.key);
      }
    }
  });
  it("returns undefined for unknown silhouettes", () => {
    expect(CURVATURE_BY_SIL["nonsense"]).toBeUndefined();
  });
});
