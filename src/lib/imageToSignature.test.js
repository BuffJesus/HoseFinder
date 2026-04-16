// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  toGrayscale, binarize, largestComponent, thinZhangSuen,
  skeletonAdjacency, pruneSpurs, longestPath, imageToSignature,
} from "./imageToSignature.js";

/** Build a mock ImageData from a packed bit grid (1 = dark ink, 0 = light). */
function makeImageData(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = rows[y][x] ? 0 : 255;   // 1 = black, 0 = white
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

/** Turn a packed bit grid into a Uint8Array mask directly (skips grayscale). */
function packMask(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rows[y][x]) out[y * w + x] = 1;
    }
  }
  return { mask: out, w, h };
}

describe("toGrayscale + binarize", () => {
  it("round-trips a black/white grid (white background)", () => {
    // Mostly light (0) with a small dark (1) plus — < 50% ink, so the
    // polarity auto-flip leaves the 1s as the 1s in the output.
    const img = makeImageData([
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ]);
    const gray = toGrayscale(img);
    const bin = binarize(gray);
    // 9 ink pixels (a plus sign) should survive as 1s.
    expect(bin.reduce((a, b) => a + b, 0)).toBe(9);
    // Center pixel (3,3) is ink.
    expect(bin[3 * 7 + 3]).toBe(1);
  });

  it("auto-flips polarity when the image is mostly dark", () => {
    // Mostly black with a white wire → should come out as white = ink.
    const rows = [];
    for (let y = 0; y < 10; y++) {
      const row = [];
      for (let x = 0; x < 10; x++) row.push(1);    // all dark
      rows.push(row);
    }
    rows[5][2] = 0; rows[5][3] = 0; rows[5][4] = 0; // a light streak
    const img = makeImageData(rows);
    const bin = binarize(toGrayscale(img));
    // The three bright pixels should be the 1s.
    expect(bin[5 * 10 + 2]).toBe(1);
    expect(bin[5 * 10 + 3]).toBe(1);
    expect(bin[5 * 10 + 4]).toBe(1);
  });
});

describe("largestComponent", () => {
  it("keeps the biggest blob and drops the rest", () => {
    const { mask, w, h } = packMask([
      [1, 1, 0, 0, 0],
      [1, 1, 0, 0, 0],
      [0, 0, 0, 1, 0],    // small blob
      [0, 0, 1, 1, 1],
      [0, 0, 1, 1, 0],
    ]);
    const out = largestComponent(mask, w, h);
    // Big blob is bottom-right (5 pixels); top-left (4 pixels) should be dropped.
    expect(out[0 * 5 + 0]).toBe(0);
    expect(out[3 * 5 + 2]).toBe(1);
  });
});

describe("thinZhangSuen", () => {
  it("produces far fewer skeleton pixels than the input mask", () => {
    // Thick horizontal bar — 4 px thick × 30 wide = 120 pixels.
    const rows = [];
    for (let y = 0; y < 12; y++) {
      const row = [];
      for (let x = 0; x < 30; x++) row.push(y >= 4 && y < 8 ? 1 : 0);
      rows.push(row);
    }
    const { mask, w, h } = packMask(rows);
    const inputCount = mask.reduce((a, b) => a + b, 0);
    const skel = thinZhangSuen(mask, w, h);
    const skelCount = skel.reduce((a, b) => a + b, 0);
    // Skeleton should be a small fraction of the input (thinned to ~1 px).
    expect(skelCount).toBeGreaterThan(0);
    expect(skelCount).toBeLessThan(inputCount / 3);
  });
});

describe("skeletonAdjacency + longestPath", () => {
  it("traces a 1-pixel diagonal path", () => {
    // Diagonal of 1s in a 6×6 grid.
    const rows = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1],
    ];
    const { mask, w, h } = packMask(rows);
    const adj = skeletonAdjacency(mask, w, h);
    const path = longestPath(adj);
    expect(path).toHaveLength(6);
  });
});

describe("pruneSpurs", () => {
  it("shrinks a skeleton with short spurs, keeps the main chain", () => {
    // Long horizontal bar (25 px) with a 3-px spur hanging off the middle.
    // 25 >> spur-min (6), so the main bar survives even though the spur
    // chain hits a branch point right next to the bar ends.
    const topRow = new Array(25).fill(1);
    const rows = [topRow, [], [], []];
    for (let r = 1; r < 4; r++) {
      const row = new Array(25).fill(0);
      row[12] = 1;
      rows[r] = row;
    }
    const { mask, w, h } = packMask(rows);
    const before = mask.reduce((a, b) => a + b, 0);
    const adj = skeletonAdjacency(mask, w, h);
    const pruned = pruneSpurs(adj, 6);
    const after = pruned.size;
    // Some pixels removed, but most of the main bar survives.
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThanOrEqual(10);
  });
});

describe("imageToSignature (end-to-end)", () => {
  it("returns a valid signature for a straight black line", () => {
    const rows = [];
    for (let y = 0; y < 10; y++) {
      const row = [];
      for (let x = 0; x < 40; x++) row.push(y >= 4 && y < 6 && x >= 4 && x < 36 ? 1 : 0);
      rows.push(row);
    }
    const img = makeImageData(rows);
    const { signature, diagnostics } = imageToSignature(img);
    expect(signature).not.toBeNull();
    expect(signature.bendCount).toBe(0);
    expect(signature.arcToChordRatio).toBeCloseTo(1.0, 1);
    expect(diagnostics.skeletonPixels).toBeGreaterThan(0);
    expect(diagnostics.endpoints).toBeGreaterThanOrEqual(2);
  });

  it("reports a helpful reason when the image has almost no ink", () => {
    const rows = [];
    for (let y = 0; y < 20; y++) {
      const row = [];
      for (let x = 0; x < 20; x++) row.push(0);
      rows.push(row);
    }
    const img = makeImageData(rows);
    const { signature, diagnostics } = imageToSignature(img);
    expect(signature).toBeNull();
    expect(diagnostics.reason).toMatch(/not enough ink|background/i);
  });
});
