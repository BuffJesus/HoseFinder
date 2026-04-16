"""Extract geometric shape signatures from hose silhouette PNGs.

Pipeline per image:
  1. Binarize (dark pixels = hose).
  2. Skeletonize to 1-pixel centerline.
  3. Walk the skeleton from one endpoint to the other (or both, for branched)
     into ordered polyline(s).
  4. Simplify with Ramer-Douglas-Peucker.
  5. Compute signature:
       - bendCount        — inflection points above a curvature threshold
       - bendAngles       — deg at each inflection (0 = straight, 90 = elbow)
       - arcLen           — sum of segment lengths (px, then normalised)
       - chordLen         — straight-line distance between the two endpoints
       - arcToChordRatio  — 1.0 = straight, >1 = curved, <0.95 suspicious
       - orientation      — deg of the end-to-end vector (0 = horizontal)
       - branchCount      — 0 for single polyline, 1+ when a T/Y/+ exists

Output: data/shape_signatures.json keyed by partNo (zero-padded filename
without extension). Signatures are pure numbers + lists; no booleans or
enums, so the JS matcher stays locale-neutral.

Usage:
    python scripts/extract_shape_signatures.py
    python scripts/extract_shape_signatures.py --limit 100     (quick test)
    python scripts/extract_shape_signatures.py --since 24000   (delta mode)
"""

from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path

import numpy as np
from PIL import Image
from skimage.measure import label as cc_label
from skimage.morphology import skeletonize, binary_closing, disk

ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = ROOT / "images" / "hoses"
OUT_PATH = ROOT / "data" / "shape_signatures.json"

# Curvature threshold — interior polyline deviation ABOVE this counts as a
# real bend. 25° means "noticeably off straight". Keeps the signal in
# bendAngles above thresholding noise without losing genuine elbows.
BEND_DEVIATION_THRESHOLD_DEG = 25.0

# RDP simplification epsilon in pixels. Tuned so a 79×122 catalog silhouette
# reduces to ~3–8 points without losing shape, after stroke smoothing.
RDP_EPSILON_PX = 2.2

# Pixel luminance below which a pixel counts as "hose ink". Silhouettes are
# strong black on white so this threshold is generous.
INK_THRESHOLD = 160

# Skeleton spurs shorter than this are pruned — they're almost always caused
# by irregular stroke edges in the low-resolution silhouette. Tuned empirically
# on a sample of ~20 silhouettes.
SPUR_MIN_PX = 4

# Morphological closing radius. A 1-pixel disk smooths out edge pixels that
# would otherwise create spurs when skeletonized. Bigger closings start
# rounding real bends, so 1 is the sweet spot.
CLOSE_RADIUS = 1


def load_binary(path: Path) -> np.ndarray:
    """Return H×W bool array where True = hose ink, restricted to the
    single largest connected component. Drops the part-number text that
    sits below each silhouette in the Gates catalog crops, plus any stray
    ink dots at the margins. The hose itself is always the largest blob.
    """
    img = Image.open(path).convert("L")
    arr = np.asarray(img, dtype=np.uint8)
    ink = arr < INK_THRESHOLD
    if ink.sum() == 0:
        return ink
    labels = cc_label(ink, connectivity=2)
    counts = np.bincount(labels.ravel())
    # Index 0 is background; pick the largest non-background component.
    if len(counts) <= 1:
        return ink
    largest = 1 + int(np.argmax(counts[1:]))
    blob = labels == largest
    # Close single-pixel gaps / spikes on the blob edge so skeletonize
    # produces a cleaner centerline.
    if CLOSE_RADIUS > 0:
        blob = binary_closing(blob, disk(CLOSE_RADIUS))
    return blob


def prune_spurs(adj: dict, min_len: int) -> dict:
    """Iteratively remove short skeleton spurs.

    A spur is a chain of ≤ `min_len` pixels ending in a degree-1 endpoint
    where the far end is a branch point (degree ≥ 3). Removing one spur
    can turn an adjacent branch point into a plain chain pixel, which may
    expose another spur, so we loop until stable.
    """
    adj = {k: list(v) for k, v in adj.items()}
    while True:
        spurs_to_remove = []
        for p, ns in adj.items():
            if len(ns) != 1:
                continue
            # Walk outward until we hit a branch point or run out of length.
            chain = [p]
            prev = p
            cur = ns[0]
            while True:
                nbrs = [n for n in adj[cur] if n != prev]
                if len(nbrs) == 0:
                    # Dead end — the whole chain IS the polyline; don't prune.
                    break
                if len(adj[cur]) >= 3:
                    # Hit a branch point. Prune only if chain is short.
                    if len(chain) <= min_len:
                        spurs_to_remove.append(chain)
                    break
                if len(chain) > min_len:
                    break
                chain.append(cur)
                prev, cur = cur, nbrs[0]
        if not spurs_to_remove:
            break
        for chain in spurs_to_remove:
            for px in chain:
                for n in list(adj.get(px, [])):
                    if n in adj:
                        try:
                            adj[n].remove(px)
                        except ValueError:
                            pass
                adj.pop(px, None)
    return adj


def skeleton_pixels(mask: np.ndarray) -> list[tuple[int, int]]:
    """Skeletonize and return an ordered list of (y, x) skeleton pixels."""
    if mask.sum() == 0:
        return []
    skel = skeletonize(mask)
    ys, xs = np.nonzero(skel)
    return list(zip(ys.tolist(), xs.tolist()))


def neighbour_map(pixels: list[tuple[int, int]]) -> dict:
    """For each skeleton pixel, list its 8-connected skeleton neighbours."""
    pset = set(pixels)
    adj = {p: [] for p in pixels}
    offsets = [(-1, -1), (-1, 0), (-1, 1),
               (0, -1),           (0, 1),
               (1, -1),  (1, 0),  (1, 1)]
    for (y, x) in pixels:
        for dy, dx in offsets:
            n = (y + dy, x + dx)
            if n in pset:
                adj[(y, x)].append(n)
    return adj


def find_endpoints(adj: dict) -> list[tuple[int, int]]:
    """Skeleton endpoints have exactly one neighbour."""
    return [p for p, ns in adj.items() if len(ns) == 1]


def find_branch_points(adj: dict) -> list[tuple[int, int]]:
    """Skeleton branch points have 3+ neighbours."""
    return [p for p, ns in adj.items() if len(ns) >= 3]


def longest_path(adj: dict, endpoints: list) -> list[tuple[int, int]]:
    """BFS from each endpoint, return the longest shortest-path chain.

    For a single-polyline skeleton this returns the full centerline ordered
    from one end to the other. For branched skeletons this returns the
    longest through-path, which is the dominant limb.
    """
    if not endpoints:
        return []

    def bfs(start):
        visited = {start: None}
        frontier = [start]
        far = start
        while frontier:
            nxt = []
            for p in frontier:
                for n in adj[p]:
                    if n not in visited:
                        visited[n] = p
                        nxt.append(n)
                        far = n
            frontier = nxt
        return far, visited

    far1, _ = bfs(endpoints[0])
    far2, parents = bfs(far1)
    path = []
    cur = far2
    while cur is not None:
        path.append(cur)
        cur = parents[cur]
    return path


def rdp(points: list[tuple[float, float]], eps: float) -> list[tuple[float, float]]:
    """Ramer-Douglas-Peucker simplification. Iterative to avoid recursion."""
    if len(points) < 3:
        return list(points)
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        i, j = stack.pop()
        if j - i < 2:
            continue
        ax, ay = points[i]
        bx, by = points[j]
        dx, dy = bx - ax, by - ay
        length = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / length, dx / length
        max_d = 0.0
        max_k = -1
        for k in range(i + 1, j):
            px, py = points[k]
            d = abs(nx * (px - ax) + ny * (py - ay))
            if d > max_d:
                max_d = d
                max_k = k
        if max_d > eps and max_k >= 0:
            keep[max_k] = True
            stack.append((i, max_k))
            stack.append((max_k, j))
    return [points[k] for k in range(len(points)) if keep[k]]


def angle_at_vertex(prev: tuple[float, float], cur: tuple[float, float], nxt: tuple[float, float]) -> float:
    """Interior angle at `cur`, degrees. 180° = straight-through; 0° = back-track."""
    ax, ay = prev[0] - cur[0], prev[1] - cur[1]
    bx, by = nxt[0] - cur[0], nxt[1] - cur[1]
    la = math.hypot(ax, ay)
    lb = math.hypot(bx, by)
    if la == 0 or lb == 0:
        return 180.0
    cos = max(-1.0, min(1.0, (ax * bx + ay * by) / (la * lb)))
    return math.degrees(math.acos(cos))


def compute_signature(path: list[tuple[int, int]], branch_count: int) -> dict | None:
    if len(path) < 3:
        return None
    # Convert (y, x) → (x, y) so math reads naturally.
    pts = [(p[1], p[0]) for p in path]
    simplified = rdp(pts, RDP_EPSILON_PX)
    if len(simplified) < 2:
        return None

    # Segment lengths.
    seg_lens = [math.hypot(b[0] - a[0], b[1] - a[1])
                for a, b in zip(simplified, simplified[1:])]
    arc_len = sum(seg_lens)
    if arc_len <= 0:
        return None
    (sx, sy), (ex, ey) = simplified[0], simplified[-1]
    chord_len = math.hypot(ex - sx, ey - sy)
    arc_to_chord = arc_len / chord_len if chord_len > 0 else 0.0
    orientation = math.degrees(math.atan2(ey - sy, ex - sx))

    # Interior bends. "Deviation" = 180 - interior angle, so 0° = straight
    # through, 90° = right angle, 180° = full reversal.
    bends = []
    for i in range(1, len(simplified) - 1):
        a = angle_at_vertex(simplified[i - 1], simplified[i], simplified[i + 1])
        dev = 180.0 - a
        if dev >= BEND_DEVIATION_THRESHOLD_DEG:
            bends.append(round(dev, 1))

    return {
        "bendCount": len(bends),
        "bendAngles": bends,
        "arcLenPx": round(arc_len, 2),
        "chordLenPx": round(chord_len, 2),
        "arcToChordRatio": round(arc_to_chord, 3),
        "orientationDeg": round(orientation, 1),
        "branchCount": branch_count,
        "polylinePointCount": len(simplified),
    }


def process_image(path: Path) -> dict | None:
    try:
        mask = load_binary(path)
    except Exception:
        return None
    if mask.sum() < 20:
        return None
    pixels = skeleton_pixels(mask)
    if not pixels:
        return None
    adj = neighbour_map(pixels)
    adj = prune_spurs(adj, SPUR_MIN_PX)
    endpoints = find_endpoints(adj)
    branch_points = find_branch_points(adj)
    if not endpoints:
        return None
    path_px = longest_path(adj, endpoints)
    return compute_signature(path_px, branch_count=len(branch_points))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=0,
                        help="Process only the first N images (testing)")
    parser.add_argument("--since", type=str, default=None,
                        help="Only process part numbers >= this value")
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    if not IMAGES_DIR.exists():
        print(f"!! images dir missing: {IMAGES_DIR}")
        return 2

    files = sorted(IMAGES_DIR.glob("*.png"))
    if args.since:
        files = [f for f in files if f.stem >= args.since]
    if args.limit:
        files = files[: args.limit]
    if not files:
        print("No input images.")
        return 0

    signatures: dict[str, dict] = {}
    start = time.time()
    for i, fp in enumerate(files, 1):
        sig = process_image(fp)
        if sig is not None:
            signatures[fp.stem] = sig
        if i % 200 == 0 or i == len(files):
            elapsed = time.time() - start
            rate = i / elapsed if elapsed > 0 else 0
            print(f"  {i}/{len(files)}  {rate:.1f}/s  extracted={len(signatures)}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as fh:
        json.dump(signatures, fh, separators=(",", ":"), sort_keys=True)

    elapsed = time.time() - start
    out_resolved = args.out.resolve()
    try:
        label = out_resolved.relative_to(ROOT)
    except ValueError:
        label = out_resolved
    print(f"Wrote {len(signatures)} signatures to {label} in {elapsed:.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
