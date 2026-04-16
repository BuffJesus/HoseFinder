import { describe, it, expect } from "vitest";
import { renderShortlistHtml, printShortlist } from "./printShortlist.js";

const SAMPLE = [
  { partNo: "24183", hoseId: "1.50", length: "18", hoseType: "radiator", visualFamily: "Upper radiator · bend" },
  { partNo: "24204", hoseId: "1.75", length: "22", hoseType: "radiator", visualFamily: "Upper radiator · straight" },
];

describe("renderShortlistHtml", () => {
  it("renders a full HTML document", () => {
    const html = renderShortlistHtml(SAMPLE, "in");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("<table>");
    expect(html).toContain("HoseFinder Parts List");
  });

  it("includes every part with inch-formatted dimensions (HTML-escaped)", () => {
    const html = renderShortlistHtml(SAMPLE, "in");
    expect(html).toContain("24183");
    expect(html).toContain("24204");
    expect(html).toContain("1.50&quot;");
    expect(html).toContain("1.75&quot;");
    expect(html).toContain("18&quot;");
    expect(html).toContain("22&quot;");
  });

  it("converts dimensions when mode is mm", () => {
    const html = renderShortlistHtml(SAMPLE, "mm");
    expect(html).toContain("38.1 mm");
    expect(html).toContain("44.4 mm"); // 1.75 * 25.4 = 44.449…, toFixed(1) rounds down
    expect(html).not.toContain("1.50&quot;");
  });

  it("pluralises the part count", () => {
    const one = renderShortlistHtml(SAMPLE.slice(0, 1), "in");
    expect(one).toMatch(/·\s*1 part</);
    const two = renderShortlistHtml(SAMPLE, "in");
    expect(two).toMatch(/·\s*2 parts</);
  });

  it("escapes HTML in part metadata", () => {
    const evil = [{
      partNo: "<script>alert(1)</script>",
      hoseId: "1.0",
      length: "10",
      hoseType: "radiator",
      visualFamily: "x & y",
    }];
    const html = renderShortlistHtml(evil, "in");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("x &amp; y");
  });

  it("accepts an explicit generatedAt for deterministic output", () => {
    const date = new Date("2026-04-16T00:00:00Z");
    const html = renderShortlistHtml(SAMPLE, "in", { generatedAt: date });
    expect(html).toContain(date.toLocaleDateString());
  });
});

describe("printShortlist", () => {
  it("returns 'empty' when list is empty", () => {
    expect(printShortlist([], "in")).toBe("empty");
    expect(printShortlist(null, "in")).toBe("empty");
  });
});
