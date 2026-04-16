import { describe, it, expect } from "vitest";
import { FLOW_CARDS, flowSummary, sizeSummary, lengthSummary } from "./wizardSummaries.js";

describe("FLOW_CARDS", () => {
  it("has exactly three cards in the documented order", () => {
    expect(FLOW_CARDS.map((c) => c.key)).toEqual(["single", "reducer", "branched"]);
  });
  it("every card has the required string fields", () => {
    for (const c of FLOW_CARDS) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(0);
      expect(c.chip.length).toBeGreaterThan(0);
      expect(c.silhouette.length).toBeGreaterThan(0);
    }
  });
});

describe("flowSummary", () => {
  it("maps each known flow to its label", () => {
    expect(flowSummary("single")).toBe("Type: Same-size");
    expect(flowSummary("reducer")).toBe("Type: Reducer");
    expect(flowSummary("branched")).toBe("Type: Branched");
  });
  it("returns empty string for 'all' and unknown values", () => {
    expect(flowSummary("all")).toBe("");
    expect(flowSummary("")).toBe("");
    expect(flowSummary("bogus")).toBe("");
  });
});

describe("sizeSummary", () => {
  it("returns empty when both ends are blank", () => {
    expect(sizeSummary("", "")).toBe("");
  });
  it("shows only End 1 when End 2 is blank", () => {
    expect(sizeSummary("1.50", "")).toBe('End 1: 1.50"');
  });
  it("shows only End 2 when End 1 is blank (reducer with one end filled)", () => {
    expect(sizeSummary("", "1.75")).toBe('End 2: 1.75"');
  });
  it("joins both ends with a middot", () => {
    expect(sizeSummary("1.50", "1.75")).toBe('End 1: 1.50" · End 2: 1.75"');
  });
});

describe("lengthSummary", () => {
  it("returns empty when length is blank and tolerance is normal", () => {
    expect(lengthSummary("", 2)).toBe("");
  });
  it("shows 'any' hint when length is blank but tolerance is 99+", () => {
    expect(lengthSummary("", 99)).toBe("Length: Any route length");
    expect(lengthSummary("", 100)).toBe("Length: Any route length");
  });
  it("formats a finite tolerance with one decimal", () => {
    expect(lengthSummary("18", 2)).toBe('Length: 18" ±2.0"');
    expect(lengthSummary("18.5", 3.5)).toBe('Length: 18.5" ±3.5"');
  });
  it("omits the ± suffix when tolerance is any", () => {
    expect(lengthSummary("18", 99)).toBe('Length: 18" · any tolerance');
    expect(lengthSummary("18", 200)).toBe('Length: 18" · any tolerance');
  });
});
