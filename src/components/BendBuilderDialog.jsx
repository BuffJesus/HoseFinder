// "Bend builder" — the sketch-your-wire surface (roadmap 10.3). User drags
// vertices to shape a polyline that matches the piece of wire they bent to
// match their routing. The polyline's signature (bendCount, bendAngles,
// arcToChordRatio) is recomputed on every change and ranked against every
// catalog hose that carries a `shape` signature.
//
// The canvas is an SVG (viewBox-scaled so everything is resolution-agnostic
// and Tailwind sizing still works). Each vertex is a circle handle that
// captures pointer events on pointerdown and follows the cursor until
// pointerup. Tested on mouse + touch via pointer events (no separate
// touchstart handlers needed).

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, Sparkles, ChevronRight } from "lucide-react";
import { HoseSilhouette } from "./HoseSilhouette.jsx";
import { Dim } from "../context/unit.jsx";
import { signatureFromPolyline, rankByShape } from "../lib/shapeMatch.js";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

const VIEW_W = 400;
const VIEW_H = 280;

// Starting polyline — a gentle-S so new users see something draggable
// rather than a blank canvas. Two interior vertices make the "drag me" UX
// immediately obvious.
const DEFAULT_POINTS = () => [
  { x: 60,  y: 140 },
  { x: 160, y: 80  },
  { x: 240, y: 200 },
  { x: 340, y: 140 },
];

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   allHoses: any[],
 *   onSelect: (hose: any) => void,
 * }} props
 */
export function BendBuilderDialog({ open, onClose, allHoses, onSelect }) {
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [dragIndex, setDragIndex] = useState(/** @type {number|null} */ (null));
  const svgRef = useRef(/** @type {SVGSVGElement | null} */ (null));

  useEffect(() => {
    if (open) setPoints(DEFAULT_POINTS());
  }, [open]);

  const toSvgPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VIEW_W;
    const y = ((clientY - rect.top) / rect.height) * VIEW_H;
    return {
      x: Math.max(6, Math.min(VIEW_W - 6, x)),
      y: Math.max(6, Math.min(VIEW_H - 6, y)),
    };
  }, []);

  const onPointerDown = (i) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragIndex(i);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (dragIndex === null) return;
    const pt = toSvgPoint(e.clientX, e.clientY);
    if (!pt) return;
    setPoints((prev) => prev.map((p, i) => (i === dragIndex ? pt : p)));
  };

  const onPointerUp = (e) => {
    setDragIndex(null);
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* empty */ }
  };

  const addBend = () => {
    setPoints((prev) => {
      if (prev.length >= 8) return prev;
      // Find the longest segment and insert a perpendicular-offset midpoint.
      let longestIdx = 0;
      let longestLen = 0;
      for (let i = 0; i < prev.length - 1; i++) {
        const dx = prev[i + 1].x - prev[i].x;
        const dy = prev[i + 1].y - prev[i].y;
        const len = Math.hypot(dx, dy);
        if (len > longestLen) { longestLen = len; longestIdx = i; }
      }
      const a = prev[longestIdx];
      const b = prev[longestIdx + 1];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // Offset 30px perpendicular to the segment, alternating side based on parity.
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const sign = prev.length % 2 === 0 ? 1 : -1;
      const nx = -dy / len * 30 * sign;
      const ny = dx / len * 30 * sign;
      const next = [...prev];
      next.splice(longestIdx + 1, 0, { x: mx + nx, y: my + ny });
      return next;
    });
  };

  const removeBend = (i) => {
    setPoints((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));
  };

  const reset = () => setPoints(DEFAULT_POINTS());

  // Flip Y so "up in the sketch" maps to "up in catalog space". Offline
  // signatures were computed in image-space (Y-down), so we invert Y here
  // before calling signatureFromPolyline — keeps orientation meaningful
  // if a future version ever uses it for matching.
  const userSig = useMemo(() => {
    const flipped = points.map((p) => ({ x: p.x, y: VIEW_H - p.y }));
    return signatureFromPolyline(flipped);
  }, [points]);

  const matches = useMemo(
    () => rankByShape(allHoses, userSig, 5),
    [allHoses, userSig],
  );

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  }, [points]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-3xl">
        <div className="px-5 pb-5 pt-6">
          <DialogHeader>
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">The wire method</div>
            <DialogTitle className="mt-1 text-xl font-semibold text-white">
              Sketch the shape of your bent wire
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Drag the violet dots to match the routing. Add bends until the sketch
              looks like your wire. Matches update live.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_260px]">
            <div
              className="relative rounded-2xl border border-white/10 bg-black/40 overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, rgba(20,20,28,0.8), rgba(9,9,14,0.8))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="block w-full touch-none select-none"
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerLeave={onPointerUp}
              >
                {/* faint grid for orientation */}
                <defs>
                  <pattern id="bb-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="bb-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#a78bfa" />
                    <stop offset="50%"  stopColor="#e879f9" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <rect width={VIEW_W} height={VIEW_H} fill="url(#bb-grid)" />

                {/* sketched polyline */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#bb-stroke)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.92"
                />

                {/* vertex handles */}
                {points.map((p, i) => {
                  const isEndpoint = i === 0 || i === points.length - 1;
                  return (
                    <g key={i}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isEndpoint ? 9 : 10}
                        fill={isEndpoint ? "#8b5cf6" : "#e879f9"}
                        stroke="#09090b"
                        strokeWidth="3"
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={onPointerDown(i)}
                        style={{ touchAction: "none" }}
                      />
                      {!isEndpoint && (
                        <circle
                          cx={p.x + 14}
                          cy={p.y - 14}
                          r="8"
                          fill="#18181b"
                          stroke="rgba(244, 63, 94, 0.5)"
                          strokeWidth="1.5"
                          className="cursor-pointer"
                          onClick={() => removeBend(i)}
                        >
                          <title>Remove this bend</title>
                        </circle>
                      )}
                      {!isEndpoint && (
                        <text
                          x={p.x + 14}
                          y={p.y - 11}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="#f87171"
                          pointerEvents="none"
                        >
                          ×
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={addBend}
                    disabled={points.length >= 8}
                    className={`h-8 rounded-xl border-0 bg-gradient-to-r ${ACCENT} px-3 text-xs font-semibold text-white disabled:opacity-40`}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add bend
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    className="h-8 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs text-zinc-200 hover:bg-white/[0.08]"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" /> Reset
                  </Button>
                </div>
                <div className="text-[10px] tabular text-zinc-400">
                  {userSig ? `${userSig.bendCount} bend${userSig.bendCount === 1 ? "" : "s"}` : "—"}
                  {userSig && userSig.bendCount > 0 && (
                    <> · {userSig.arcToChordRatio.toFixed(2)}× arc</>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
                  Top matches
                </div>
                <Sparkles className="h-3 w-3 text-violet-300/80" />
              </div>
              {matches.length === 0 ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/8 p-3 text-[11px] text-amber-200">
                  Loading shape data… try again in a moment.
                </div>
              ) : (
                <div className="grid gap-1.5">
                  {matches.map(({ hose, distance }, i) => (
                    <button
                      key={hose.partNo}
                      type="button"
                      onClick={() => { onSelect(hose); onClose(); }}
                      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-left transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                    >
                      <div className="h-8 w-14 shrink-0 text-violet-300">
                        <HoseSilhouette type={hose.silhouette} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold tabular text-white">{hose.partNo}</div>
                        <div className="truncate text-[11px] text-zinc-400">{hose.visualFamily}</div>
                      </div>
                      <div className="text-right text-[10px] tabular text-zinc-400">
                        <div className="text-violet-300/80">#{i + 1}</div>
                        <div className="mt-0.5">
                          <Dim value={hose.hoseId} />
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
                    </button>
                  ))}
                </div>
              )}
              <div className="pt-1 text-[10px] text-zinc-400 leading-4">
                Ranking combines bend count, angle set, and arc-to-chord ratio.
                Exact length isn't considered — enter it separately in the wizard
                if you need it.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
