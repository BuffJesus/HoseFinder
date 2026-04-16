import { describe, it, expect } from "vitest";
import { fmtDim, fmtLen, inchStringToDisplay, parseUnitInput, MM_PER_IN } from "./units.js";

describe("fmtDim", () => {
  it("formats decimals in inches", () => {
    expect(fmtDim("1.5", "in")).toBe("1.5\"");
    expect(fmtDim(0.75, "in")).toBe("0.75\"");
  });
  it("converts to mm", () => {
    expect(fmtDim("1", "mm")).toBe("25.4 mm");
    expect(fmtDim("1.5", "mm", 1)).toBe("38.1 mm");
  });
  it("handles compound X strings", () => {
    expect(fmtDim("1.5 X 2.0", "in")).toBe("1.5 × 2\"");
    expect(fmtDim("1 X 2", "mm", 0)).toBe("25 × 51 mm");
  });
  it("returns empty for null/blank/unparseable", () => {
    expect(fmtDim(null, "in")).toBe("");
    expect(fmtDim("", "in")).toBe("");
    expect(fmtDim("not a number", "in")).toBe("not a number");
  });
});

describe("inchStringToDisplay", () => {
  it("is identity for inches", () => {
    expect(inchStringToDisplay("1.5", "in")).toBe("1.5");
  });
  it("converts inches string → mm display", () => {
    expect(inchStringToDisplay("1.5", "mm")).toBe("38.1");
  });
  it("returns empty for empty input", () => {
    expect(inchStringToDisplay("", "mm")).toBe("");
    expect(inchStringToDisplay("", "in")).toBe("");
  });
});

describe("parseUnitInput", () => {
  it("identity in inches", () => {
    expect(parseUnitInput("1.5", "in")).toBe("1.5");
  });
  it("converts mm input → canonical inches string", () => {
    const out = parseUnitInput("38.1", "mm");
    expect(parseFloat(out)).toBeCloseTo(1.5, 2);
  });
  it("round-trips within tolerance", () => {
    const originalInches = "1.500";
    const displayMm = inchStringToDisplay(originalInches, "mm");
    const back = parseUnitInput(displayMm, "mm");
    expect(parseFloat(back)).toBeCloseTo(parseFloat(originalInches), 2);
  });
});

describe("fmtLen", () => {
  it("handles numeric input", () => {
    expect(fmtLen(1, "in")).toBe("1\"");
    expect(fmtLen(1, "mm")).toBe("25.4 mm");
  });
  it("handles string input", () => {
    expect(fmtLen("2", "mm", { digits: 0 })).toBe("51 mm");
  });
});

describe("MM_PER_IN constant", () => {
  it("is exactly 25.4", () => {
    expect(MM_PER_IN).toBe(25.4);
  });
});

describe("locale-aware formatting", () => {
  it("fmtDim uses comma decimals for es", () => {
    expect(fmtDim("1.5", "in", undefined, "es")).toBe("1,5\"");
    expect(fmtDim("0.75", "in", undefined, "es")).toBe("0,75\"");
    expect(fmtDim("1.5", "mm", 1, "es")).toBe("38,1 mm");
  });
  it("fmtDim retains period for en / default", () => {
    expect(fmtDim("1.5", "in")).toBe("1.5\"");
    expect(fmtDim("1.5", "in", undefined, "en")).toBe("1.5\"");
  });
  it("fmtDim localises compound X strings", () => {
    expect(fmtDim("1.5 X 2.0", "in", 2, "es")).toBe("1,50 × 2,00\"");
  });
  it("fmtLen accepts locale option", () => {
    expect(fmtLen(1, "in", { digits: 2, locale: "es" })).toBe("1,00\"");
    expect(fmtLen(1.5, "mm", { digits: 1, locale: "es" })).toBe("38,1 mm");
  });
  it("parseUnitInput accepts comma as decimal separator", () => {
    expect(parseUnitInput("1,5", "in")).toBe("1.5");
    const out = parseUnitInput("38,1", "mm");
    expect(parseFloat(out)).toBeCloseTo(1.5, 2);
  });
  it("inchStringToDisplay stays locale-neutral (feeds back to parser)", () => {
    expect(inchStringToDisplay("1.5", "in")).toBe("1.5");
    expect(inchStringToDisplay("1.5", "mm")).toBe("38.1");
  });
});
