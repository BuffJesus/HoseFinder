import { describe, it, expect } from "vitest";
import { editDistance } from "./strings.js";

describe("editDistance", () => {
  it("is 0 for identical strings", () => {
    expect(editDistance("12345", "12345")).toBe(0);
    expect(editDistance("", "")).toBe(0);
  });
  it("is length diff when one string is empty", () => {
    expect(editDistance("", "abc")).toBe(3);
    expect(editDistance("abc", "")).toBe(3);
  });
  it("counts single substitution", () => {
    expect(editDistance("12345", "12355")).toBe(1);
  });
  it("counts insertions / deletions", () => {
    expect(editDistance("12345", "123456")).toBe(1);
    expect(editDistance("123456", "12345")).toBe(1);
  });
  it("catches thumb-typo candidates", () => {
    // 12500 vs 12050 — two digits out of place → 2
    expect(editDistance("12500", "12050")).toBe(2);
  });
  it("early-exits past the cap", () => {
    // Distance of 4 is capped at cap+1 when cap=2
    const d = editDistance("aaaaa", "bbbbb", 2);
    expect(d).toBe(3); // cap + 1
  });
  it("returns cap+1 when length difference exceeds cap", () => {
    expect(editDistance("a", "aaaaaaa", 2)).toBe(3); // cap + 1
  });
});
