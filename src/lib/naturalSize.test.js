import { describe, it, expect } from "vitest";
import { parseNaturalSize, fractionSuggestionsFor, COMMON_FRACTIONS } from "./naturalSize.js";
import { MM_PER_IN } from "./units.js";

describe("parseNaturalSize (inches mode)", () => {
  it("parses decimals", () => {
    expect(parseNaturalSize("1.5", "in")).toBeCloseTo(1.5);
    expect(parseNaturalSize("0.75", "in")).toBeCloseTo(0.75);
  });
  it("parses mixed numbers with hyphen joiner", () => {
    expect(parseNaturalSize("1-1/2", "in")).toBeCloseTo(1.5);
    expect(parseNaturalSize("2-3/4", "in")).toBeCloseTo(2.75);
  });
  it("parses mixed numbers with space", () => {
    expect(parseNaturalSize("1 1/2", "in")).toBeCloseTo(1.5);
  });
  it("parses pure fractions", () => {
    expect(parseNaturalSize("3/4", "in")).toBeCloseTo(0.75);
    expect(parseNaturalSize("1/2", "in")).toBeCloseTo(0.5);
  });
  it("strips inch marks and 'in' / 'inch' suffix", () => {
    expect(parseNaturalSize('1.5"', "in")).toBeCloseTo(1.5);
    expect(parseNaturalSize("1.5 in", "in")).toBeCloseTo(1.5);
    expect(parseNaturalSize("1 1/2 inches", "in")).toBeCloseTo(1.5);
  });
  it("returns null for unparseable input", () => {
    expect(parseNaturalSize("abc", "in")).toBe(null);
    expect(parseNaturalSize("", "in")).toBe(null);
    expect(parseNaturalSize(null, "in")).toBe(null);
  });
  it("treats mm suffix as explicit metric", () => {
    // 38 mm → ~1.496 inches in inches mode
    expect(parseNaturalSize("38mm", "in")).toBeCloseTo(38 / MM_PER_IN, 3);
    expect(parseNaturalSize("38 mm", "in")).toBeCloseTo(38 / MM_PER_IN, 3);
  });
});

describe("parseNaturalSize (mm mode)", () => {
  it("treats bare numbers as millimetres", () => {
    expect(parseNaturalSize("38", "mm")).toBe(38);
  });
  it("converts mixed numbers from their inch meaning into mm", () => {
    expect(parseNaturalSize("1-1/2", "mm")).toBeCloseTo(1.5 * MM_PER_IN, 2);
  });
  it("keeps mm-suffixed values as mm", () => {
    expect(parseNaturalSize("38mm", "mm")).toBe(38);
  });
});

describe("fractionSuggestionsFor", () => {
  it("suggests nothing for empty input", () => {
    expect(fractionSuggestionsFor("")).toEqual([]);
    expect(fractionSuggestionsFor(null)).toEqual([]);
  });
  it("suggests all when only a numerator is typed", () => {
    expect(fractionSuggestionsFor("1")).toBe(COMMON_FRACTIONS);
    expect(fractionSuggestionsFor("1/")).toBe(COMMON_FRACTIONS);
  });
  it("shows all when only numerator with optional slash is typed", () => {
    // "3/" doesn't have a denominator yet — fall through to the all-common branch
    expect(fractionSuggestionsFor("3/")).toBe(COMMON_FRACTIONS);
  });
  it("narrows to matching numerators once a denominator starts", () => {
    // "5/6" — numerator 5, denominator starts with "6"; of the common set, only 5/8 begins with "5/"
    const out = fractionSuggestionsFor("5/6");
    expect(out.map((f) => f.label)).toEqual(["5/8"]);
  });
});
