import { describe, it, expect } from "vitest";
import { scoreAndFilter, NO_FILTERS } from "./filter.js";

/** Build a plausible enriched hose for testing. */
const h = (overrides = {}) => ({
  partNo: "24183",
  hoseId: "1.75",
  hoseType: "single",
  silhouette: "sweep",
  sizeBand: "radiator-mid",
  length: 18.5,
  endCount: 1,
  endSizes: [1.75],
  visualFamily: "Upper/lower radiator",
  tags: ["same-size", "radiator mid"],
  ...overrides,
});

/** Filter params helper — start from NO_FILTERS and override. */
const params = (overrides = {}) => ({ ...NO_FILTERS, ...overrides });

describe("scoreAndFilter — hard filters", () => {
  it("excludes on flow mismatch", () => {
    expect(scoreAndFilter(h(), params({ flow: "reducer" }))).toBe(null);
  });
  it("excludes on size band mismatch", () => {
    expect(scoreAndFilter(h(), params({ sizeBandFilter: "bypass" }))).toBe(null);
  });
  it("excludes on end count mismatch (string compare)", () => {
    expect(scoreAndFilter(h(), params({ endCountFilter: "2" }))).toBe(null);
  });
  it("passes hard filters when they all say 'all'", () => {
    const out = scoreAndFilter(h(), params());
    expect(out).not.toBe(null);
    expect(out._score).toBe(1);
    expect(out._matchQuality).toBe(null);
    expect(out._gap).toBe(null);
  });
});

describe("scoreAndFilter — curvature / silhouettes / length class / step ratio", () => {
  it("excludes hoses outside the selected curvature group", () => {
    const out = scoreAndFilter(
      h({ silhouette: "elbow" }),
      params({ curvature: new Set(["sweep"]) }),
    );
    expect(out).toBe(null);
  });
  it("keeps hoses inside the selected curvature group", () => {
    const out = scoreAndFilter(
      h({ silhouette: "sweep" }),
      params({ curvature: new Set(["sweep"]) }),
    );
    expect(out).not.toBe(null);
  });
  it("respects silhouette allow-list", () => {
    expect(scoreAndFilter(h(), params({ silhouettes: new Set(["elbow"]) }))).toBe(null);
    expect(scoreAndFilter(h(), params({ silhouettes: new Set(["sweep"]) }))).not.toBe(null);
  });
  it("respects length-class buckets", () => {
    // 18.5" falls in 'standard'; 'stub' should exclude
    expect(scoreAndFilter(h(), params({ lengthClass: new Set(["stub"]) }))).toBe(null);
    expect(scoreAndFilter(h(), params({ lengthClass: new Set(["standard"]) }))).not.toBe(null);
  });
  it("step-ratio filter excludes non-reducers and unmatched buckets", () => {
    // single (not reducer) → excluded
    expect(scoreAndFilter(h(), params({ stepRatio: new Set(["small"]) }))).toBe(null);

    const reducer = h({
      hoseType: "reducer", endCount: 2, endSizes: [1.5, 1.75], hoseId: "1.50 X 1.75",
    });
    // ratio 1.167 → 'small' bucket
    expect(scoreAndFilter(reducer, params({ stepRatio: new Set(["small"]) }))).not.toBe(null);
    expect(scoreAndFilter(reducer, params({ stepRatio: new Set(["large"]) }))).toBe(null);
  });
});

describe("scoreAndFilter — text search", () => {
  it("matches partNo substring (case-insensitive)", () => {
    expect(scoreAndFilter(h(), params({ search: "2418" }))).not.toBe(null);
    expect(scoreAndFilter(h(), params({ search: "99999" }))).toBe(null);
  });
  it("matches visualFamily text", () => {
    expect(scoreAndFilter(h(), params({ search: "radiator" }))).not.toBe(null);
  });
  it("matches hoseType text", () => {
    expect(scoreAndFilter(h(), params({ search: "single" }))).not.toBe(null);
  });
  it("blank/whitespace-only search is treated as no search", () => {
    expect(scoreAndFilter(h(), params({ search: "   " }))).not.toBe(null);
  });
});

describe("scoreAndFilter — dimension scoring", () => {
  it("exact ID + length returns matchQuality 'exact' and gap flags set", () => {
    const out = scoreAndFilter(h(), params({
      targetId1: "1.75", targetLen: "18.5", idTol: 0.06, lenTol: 2,
    }));
    expect(out).not.toBe(null);
    expect(out._matchQuality).toBe("exact");
    expect(out._gap.idExact).toBe(true);
    expect(out._gap.lenExact).toBe(true);
    expect(out._gap.idDir).toBe("exact");
    expect(out._gap.lenDir).toBe("exact");
    expect(out._score).toBe(1);
  });

  it("rejects ID outside tolerance", () => {
    const out = scoreAndFilter(h(), params({
      targetId1: "1.5", idTol: 0.06, lenTol: 2,
    }));
    expect(out).toBe(null);
  });

  it("accepts a near-miss ID within tolerance with lower score", () => {
    const out = scoreAndFilter(h(), params({
      targetId1: "1.72", idTol: 0.06, lenTol: 2,
    }));
    expect(out).not.toBe(null);
    expect(out._gap.idExact).toBe(false);
    expect(out._gap.idDir).toBe("larger"); // nearest end is 1.75 > target 1.72
    expect(out._score).toBeLessThan(1);
    expect(out._score).toBeGreaterThan(0);
  });

  it("reports length direction correctly", () => {
    const out = scoreAndFilter(h(), params({
      targetLen: "17", lenTol: 4,
    }));
    expect(out._gap.lenDir).toBe("longer"); // 18.5 > 17
    const out2 = scoreAndFilter(h(), params({
      targetLen: "20", lenTol: 4,
    }));
    expect(out2._gap.lenDir).toBe("shorter");
  });

  it("requires two ends when targetId2 is set", () => {
    // single-end hose, targetId2 set → null
    const out = scoreAndFilter(h(), params({
      targetId1: "1.75", targetId2: "1.25", idTol: 0.06,
    }));
    expect(out).toBe(null);
  });

  it("scores a two-end reducer on both ends", () => {
    const reducer = h({
      hoseType: "reducer", endCount: 2,
      endSizes: [1.5, 1.75], hoseId: "1.50 X 1.75",
    });
    const out = scoreAndFilter(reducer, params({
      flow: "reducer",
      targetId1: "1.5", targetId2: "1.75", idTol: 0.06,
    }));
    expect(out).not.toBe(null);
    expect(out._matchQuality).toBe("exact");
  });
});

describe("scoreAndFilter — matchQuality thresholds", () => {
  it("marks approx when penalties are moderate", () => {
    // ID 0.05 off (borderline), length 1.0 off → totalScore around mid
    const out = scoreAndFilter(h(), params({
      targetId1: "1.70", targetLen: "17.5", idTol: 0.06, lenTol: 2,
    }));
    expect(out).not.toBe(null);
    expect(out._matchQuality === "close" || out._matchQuality === "approx").toBe(true);
  });
});
