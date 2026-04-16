// Client-side image → shape signature pipeline for the photo-of-wire
// matcher (roadmap 10.4). Mirrors the Python offline pipeline in
// scripts/extract_shape_signatures.py but runs in the browser on a
// user-supplied photo. The math is plain typed arrays — no OpenCV, no
// WebAssembly — so it runs anywhere ImageData runs.
//
// Stages (same order as the Python script):
//   1. RGB → luminance → binarize on a dynamic threshold
//   2. Keep the largest 4-connected component (drops background noise)
//   3. Zhang-Suen thinning to a 1-pixel centerline
//   4. Prune short skeleton spurs
//   5. BFS for the longest endpoint-to-endpoint path
//   6. Ramer-Douglas-Peucker simplification
//   7. Reuse `signatureFromPolyline` for the final Signature
//
// All stages operate on flat Uint8Array (value 0 or 1) indexed as y*w+x.
// That keeps the bundle small and lets the hot loops stay in plain JS
// without fighting the JIT.

import { signatureFromPolyline } from "./shapeMatch.js";

/** @typedef {import("./shapeMatch.js").Signature} Signature */

/**
 * @typedef {{
 *   signature: Signature | null,
 *   diagnostics: {
 *     width: number, height: number,
 *     inkPixels: number,
 *     skeletonPixels: number,
 *     endpoints: number,
 *     polylinePoints: number,
 *     reason?: string,
 *   },
 * }} PipelineResult
 */

const SPUR_MIN_PX = 6;
const RDP_EPSILON_PX = 2.5;

/**
 * Convert an ImageData object to a grayscale Uint8ClampedArray.
 * @param {ImageData} img
 * @returns {Uint8ClampedArray}
 */
export function toGrayscale(img) {
  const src = img.data;
  const out = new Uint8ClampedArray(img.width * img.height);
  for (let i = 0, j = 0; i < src.length; i += 4, j++) {
    // Rec. 601 luma weights — fine for line/edge detection.
    out[j] = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) | 0;
  }
  return out;
}

/**
 * Binarize a grayscale image. Picks whichever polarity (dark ink or
 * light ink) yields roughly 1–20% foreground pixels — that's the sweet
 * spot for a single wire silhouette. Returns 1 for ink, 0 elsewhere.
 * @param {Uint8ClampedArray} gray
 * @param {number} threshold - 0-255; pixels darker than this are ink.
 * @returns {Uint8Array}
 */
export function binarize(gray, threshold = 110) {
  const out = new Uint8Array(gray.length);
  let darkCount = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < threshold) { out[i] = 1; darkCount++; }
  }
  const ratio = darkCount / gray.length;
  // If the ink polarity is inverted (bright wire on dark background), flip
  // the mask so the wire is the 1s.
  if (ratio > 0.5) {
    for (let i = 0; i < out.length; i++) out[i] = 1 - out[i];
  }
  return out;
}

/**
 * Keep only the single largest 4-connected component. Everything else is
 * cleared. In-place on a copy of the input so the caller retains the raw.
 * @param {Uint8Array} mask
 * @param {number} w
 * @param {number} h
 * @returns {Uint8Array}
 */
export function largestComponent(mask, w, h) {
  const labels = new Int32Array(mask.length);
  const sizes = [0]; // label 0 = background sentinel
  const stack = [];
  let nextLabel = 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!mask[idx] || labels[idx]) continue;
      const L = nextLabel++;
      let size = 0;
      stack.push(idx);
      labels[idx] = L;
      while (stack.length) {
        const p = stack.pop();
        size++;
        const py = (p / w) | 0;
        const px = p - py * w;
        // 4-neighbours
        if (px > 0 && mask[p - 1] && !labels[p - 1]) { labels[p - 1] = L; stack.push(p - 1); }
        if (px < w - 1 && mask[p + 1] && !labels[p + 1]) { labels[p + 1] = L; stack.push(p + 1); }
        if (py > 0 && mask[p - w] && !labels[p - w]) { labels[p - w] = L; stack.push(p - w); }
        if (py < h - 1 && mask[p + w] && !labels[p + w]) { labels[p + w] = L; stack.push(p + w); }
      }
      sizes.push(size);
    }
  }
  if (nextLabel === 1) return mask;
  let best = 1;
  for (let i = 2; i < sizes.length; i++) if (sizes[i] > sizes[best]) best = i;
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) if (labels[i] === best) out[i] = 1;
  return out;
}

/**
 * Zhang-Suen thinning — iterate two passes until no more pixels are
 * marked for deletion. Result has every surviving pixel as part of a
 * 1-pixel-wide skeleton.
 * @param {Uint8Array} mask
 * @param {number} w
 * @param {number} h
 * @returns {Uint8Array}
 */
export function thinZhangSuen(mask, w, h) {
  const out = new Uint8Array(mask);

  const neighbors = (p) => {
    // P2..P9 in Zhang-Suen order (top, then clockwise).
    const y = (p / w) | 0;
    const x = p - y * w;
    if (x <= 0 || x >= w - 1 || y <= 0 || y >= h - 1) return null;
    return [
      out[p - w],       // P2 top
      out[p - w + 1],   // P3 top-right
      out[p + 1],       // P4 right
      out[p + w + 1],   // P5 bottom-right
      out[p + w],       // P6 bottom
      out[p + w - 1],   // P7 bottom-left
      out[p - 1],       // P8 left
      out[p - w - 1],   // P9 top-left
    ];
  };

  const zeroToOneTransitions = (n) => {
    // Count 0→1 transitions in P2,P3,P4,P5,P6,P7,P8,P9,P2
    let c = 0;
    for (let i = 0; i < 8; i++) {
      if (n[i] === 0 && n[(i + 1) % 8] === 1) c++;
    }
    return c;
  };

  const toDelete = [];
  let changed = true;
  while (changed) {
    changed = false;
    // Step 1
    toDelete.length = 0;
    for (let p = 0; p < out.length; p++) {
      if (!out[p]) continue;
      const n = neighbors(p);
      if (!n) continue;
      let b = 0;
      for (let i = 0; i < 8; i++) b += n[i];
      if (b < 2 || b > 6) continue;
      if (zeroToOneTransitions(n) !== 1) continue;
      if (n[0] * n[2] * n[4] !== 0) continue; // P2·P4·P6
      if (n[2] * n[4] * n[6] !== 0) continue; // P4·P6·P8
      toDelete.push(p);
    }
    if (toDelete.length) { changed = true; for (const p of toDelete) out[p] = 0; }

    // Step 2
    toDelete.length = 0;
    for (let p = 0; p < out.length; p++) {
      if (!out[p]) continue;
      const n = neighbors(p);
      if (!n) continue;
      let b = 0;
      for (let i = 0; i < 8; i++) b += n[i];
      if (b < 2 || b > 6) continue;
      if (zeroToOneTransitions(n) !== 1) continue;
      if (n[0] * n[2] * n[6] !== 0) continue; // P2·P4·P8
      if (n[0] * n[4] * n[6] !== 0) continue; // P2·P6·P8
      toDelete.push(p);
    }
    if (toDelete.length) { changed = true; for (const p of toDelete) out[p] = 0; }
  }

  return out;
}

/**
 * Build an adjacency map for a skeleton mask: pixel index → list of
 * 8-connected neighbour pixel indices (both in the skeleton).
 * @param {Uint8Array} skel
 * @param {number} w
 * @param {number} h
 * @returns {Map<number, number[]>}
 */
export function skeletonAdjacency(skel, w, h) {
  const adj = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (!skel[p]) continue;
      const ns = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (skel[q]) ns.push(q);
        }
      }
      adj.set(p, ns);
    }
  }
  return adj;
}

/**
 * Prune short skeleton spurs (chain of ≤ min_len pixels ending at a
 * degree-1 endpoint where the far end is a degree-≥3 branch point).
 * @param {Map<number, number[]>} adj
 * @param {number} minLen
 * @returns {Map<number, number[]>}
 */
export function pruneSpurs(adj, minLen = SPUR_MIN_PX) {
  // Clone for safe mutation.
  const m = new Map();
  for (const [k, v] of adj) m.set(k, [...v]);
  let iterations = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (++iterations > 200) break;
    const spurs = [];
    for (const [p, ns] of m) {
      if (ns.length !== 1) continue;
      const chain = [p];
      let prev = p;
      let cur = ns[0];
      let killed = false;
      while (true) {
        const curNs = m.get(cur) || [];
        const forward = curNs.filter((n) => n !== prev);
        if (forward.length === 0) break;
        if (curNs.length >= 3) {
          if (chain.length <= minLen) { spurs.push(chain); killed = true; }
          break;
        }
        if (chain.length > minLen) break;
        chain.push(cur);
        prev = cur;
        cur = forward[0];
      }
      if (killed) break; // process one spur per iteration to keep logic simple
    }
    if (spurs.length === 0) break;
    for (const chain of spurs) {
      for (const px of chain) {
        const ns = m.get(px) || [];
        for (const n of ns) {
          const arr = m.get(n);
          if (arr) {
            const i = arr.indexOf(px);
            if (i >= 0) arr.splice(i, 1);
          }
        }
        m.delete(px);
      }
    }
  }
  return m;
}

/**
 * BFS from each endpoint to find the longest shortest-path chain. For a
 * simple polyline skeleton this returns the full centerline ordered from
 * one end to the other. For branched skeletons this returns the
 * dominant limb.
 * @param {Map<number, number[]>} adj
 * @returns {number[]}
 */
export function longestPath(adj) {
  const endpoints = [];
  for (const [p, ns] of adj) if (ns.length === 1) endpoints.push(p);
  if (endpoints.length === 0) return [];
  const bfs = (start) => {
    const parents = new Map();
    parents.set(start, null);
    let frontier = [start];
    let far = start;
    while (frontier.length) {
      const next = [];
      for (const p of frontier) {
        for (const n of adj.get(p) || []) {
          if (!parents.has(n)) { parents.set(n, p); next.push(n); far = n; }
        }
      }
      frontier = next;
    }
    return { far, parents };
  };
  const r1 = bfs(endpoints[0]);
  const r2 = bfs(r1.far);
  const path = [];
  let cur = r2.far;
  while (cur !== undefined && cur !== null) {
    path.push(cur);
    cur = r2.parents.get(cur);
  }
  return path;
}

/**
 * Ramer-Douglas-Peucker simplification on a 2D polyline.
 * @param {Array<{x: number, y: number}>} points
 * @param {number} eps
 */
function rdp(points, eps) {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1; keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    if (j - i < 2) continue;
    const ax = points[i].x, ay = points[i].y;
    const bx = points[j].x, by = points[j].y;
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    let maxD = 0, maxK = -1;
    for (let k = i + 1; k < j; k++) {
      const d = Math.abs(nx * (points[k].x - ax) + ny * (points[k].y - ay));
      if (d > maxD) { maxD = d; maxK = k; }
    }
    if (maxD > eps && maxK >= 0) {
      keep[maxK] = 1;
      stack.push([i, maxK]);
      stack.push([maxK, j]);
    }
  }
  const out = [];
  for (let k = 0; k < points.length; k++) if (keep[k]) out.push(points[k]);
  return out;
}

/**
 * Full pipeline. Takes an ImageData, returns a signature + diagnostics.
 * @param {ImageData} img
 * @returns {PipelineResult}
 */
export function imageToSignature(img) {
  const w = img.width;
  const h = img.height;
  const diagnostics = {
    width: w, height: h,
    inkPixels: 0, skeletonPixels: 0, endpoints: 0, polylinePoints: 0,
  };
  const gray = toGrayscale(img);
  const raw = binarize(gray);
  diagnostics.inkPixels = raw.reduce((a, b) => a + b, 0);
  if (diagnostics.inkPixels < 50) {
    return { signature: null, diagnostics: { ...diagnostics, reason: "Not enough ink — is the wire visible on a contrasting background?" } };
  }
  const largest = largestComponent(raw, w, h);
  const skel = thinZhangSuen(largest, w, h);
  diagnostics.skeletonPixels = skel.reduce((a, b) => a + b, 0);
  if (diagnostics.skeletonPixels < 10) {
    return { signature: null, diagnostics: { ...diagnostics, reason: "Couldn't thin to a wire. Try a clearer photo." } };
  }
  const adj = skeletonAdjacency(skel, w, h);
  const pruned = pruneSpurs(adj, SPUR_MIN_PX);
  const endpoints = [...pruned].filter(([, ns]) => ns.length === 1).length;
  diagnostics.endpoints = endpoints;
  if (endpoints === 0) {
    return { signature: null, diagnostics: { ...diagnostics, reason: "Wire appears to be a closed loop — straighten one end and retry." } };
  }
  const pathIdx = longestPath(pruned);
  if (pathIdx.length < 3) {
    return { signature: null, diagnostics: { ...diagnostics, reason: "Wire is too short — frame it larger in the photo." } };
  }
  // Convert pixel indices to {x, y}. Offline extractor flips Y so "up"
  // means "up in the catalog"; do the same here for symmetry with
  // canvas-drawn sketches in the BendBuilderDialog.
  const pts = pathIdx.map((p) => ({ x: p % w, y: h - ((p / w) | 0) }));
  const simplified = rdp(pts, RDP_EPSILON_PX);
  diagnostics.polylinePoints = simplified.length;
  const sig = signatureFromPolyline(simplified);
  return { signature: sig, diagnostics };
}
