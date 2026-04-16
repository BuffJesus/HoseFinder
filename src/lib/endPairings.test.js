import { describe, it, expect } from "vitest";
import { validPairingsFor, isPairingValid } from "./endPairings.js";

const HOSES = [
  { partNo: "A", endSizes: [1.5, 1.75] },
  { partNo: "B", endSizes: [1.5, 1.75] },  // duplicate pair
  { partNo: "C", endSizes: [1.5, 2.0] },
  { partNo: "D", endSizes: [1.25, 1.5] },
  { partNo: "E", endSizes: [0.75] },        // single-end, irrelevant
  { partNo: "F", endSizes: [1.5, 1.5, 0.75] }, // branched, 3 ends
  { partNo: "G", endSizes: [] },            // empty safety case
  { partNo: "H" },                           // missing endSizes
];

describe("validPairingsFor", () => {
  it("returns null when the fixed value doesn't parse", () => {
    expect(validPairingsFor(HOSES, "")).toBe(null);
    expect(validPairingsFor(HOSES, "abc")).toBe(null);
    expect(validPairingsFor(HOSES, NaN)).toBe(null);
  });

  it("collects every partner diameter for the fixed value", () => {
    const valid = validPairingsFor(HOSES, "1.5");
    expect(valid).toBeInstanceOf(Set);
    expect([...valid].sort()).toEqual([0.75, 1.25, 1.75, 2]);
  });

  it("de-duplicates partner sizes across hoses", () => {
    // A and B both pair 1.5 with 1.75 — set must have one 1.75 entry, not two.
    const valid = validPairingsFor(HOSES, 1.5);
    const seventyFives = [...valid].filter((v) => Math.abs(v - 1.75) < 0.01);
    expect(seventyFives).toHaveLength(1);
  });

  it("excludes the fixed value itself from the partner set", () => {
    // Hose F has [1.5, 1.5, 0.75]. Fixed = 1.5. The two 1.5 entries match
    // the fixed and should be skipped; only 0.75 surfaces as a partner.
    const just1_5 = validPairingsFor([{ endSizes: [1.5, 1.5, 0.75] }], 1.5);
    expect([...just1_5]).toEqual([0.75]);
  });

  it("returns an empty set when no hose has the fixed value", () => {
    const valid = validPairingsFor(HOSES, 9.99);
    expect(valid).toBeInstanceOf(Set);
    expect(valid.size).toBe(0);
  });

  it("accepts numeric and string fixed inputs equivalently", () => {
    const fromStr = validPairingsFor(HOSES, "1.50");
    const fromNum = validPairingsFor(HOSES, 1.5);
    expect([...fromStr].sort()).toEqual([...fromNum].sort());
  });

  it("tolerates missing or empty endSizes arrays", () => {
    expect(() => validPairingsFor(HOSES, "1.5")).not.toThrow();
  });

  it("matches with small tolerance so 1.5 and 1.500001 unify", () => {
    const hose = [{ endSizes: [1.500001, 1.75] }];
    const valid = validPairingsFor(hose, "1.5");
    expect(valid.has(1.75)).toBe(true);
  });
});

describe("isPairingValid", () => {
  it("returns true when validSet is null (no constraint)", () => {
    expect(isPairingValid(null, "1.75")).toBe(true);
    expect(isPairingValid(null, 9.99)).toBe(true);
  });

  it("returns true when candidate is in the set", () => {
    const set = new Set([1.5, 1.75, 2.0]);
    expect(isPairingValid(set, 1.75)).toBe(true);
    expect(isPairingValid(set, "1.75")).toBe(true);
    expect(isPairingValid(set, "1.5")).toBe(true);
  });

  it("returns false when candidate is not in the set", () => {
    const set = new Set([1.5, 1.75]);
    expect(isPairingValid(set, 2.0)).toBe(false);
    expect(isPairingValid(set, "3.0")).toBe(false);
  });

  it("returns false for unparseable candidates", () => {
    const set = new Set([1.5, 1.75]);
    expect(isPairingValid(set, "abc")).toBe(false);
    expect(isPairingValid(set, "")).toBe(false);
  });

  it("matches within tolerance so 1.5 matches 1.500001 in the set", () => {
    const set = new Set([1.500001]);
    expect(isPairingValid(set, "1.5")).toBe(true);
  });
});
