// Canvas-driven photo measurement. Upload a photo containing a known-size
// reference (credit card, coin, bill…). Drag endpoints on the reference
// line, then drag endpoints on the measurement line. Pixel ratio →
// real-world dimension. Applies to any of End 1 / End 2 / Length.

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUnit } from "../context/unit.jsx";
import { MM_PER_IN } from "../lib/units.js";
import { pushMeasurementHistory } from "../lib/measurementHistory.js";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

// Known-length references in millimetres.
const PHOTO_REFERENCES = [
  { key: "credit-card",  label: "Credit card (long edge)", mm: 85.6 },
  { key: "us-quarter",   label: "US quarter",              mm: 24.26 },
  { key: "us-dollar",    label: "US dollar bill (long)",   mm: 155.956 },
  { key: "euro-1",       label: "€1 coin",                 mm: 23.25 },
  { key: "aa-battery",   label: "AA battery (length)",     mm: 50.5 },
  { key: "custom",       label: "Custom — enter length",   mm: null },
];

function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onApply: (field: "id1"|"id2"|"len", inches: string) => void,
 * }} props
 */
export function PhotoMeasureDialog({ open, onClose, onApply }) {
  const unitMode = useUnit();
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [, setImgDims] = useState({ w: 0, h: 0 });
  const [refKey, setRefKey] = useState("credit-card");
  const [customMm, setCustomMm] = useState("");
  const [refLine, setRefLine] = useState(null);
  const [measLine, setMeasLine] = useState(null);
  const [drag, setDrag] = useState(null);
  const [stage, setStage] = useState("upload");
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setImageDataUrl(null);
      setRefLine(null);
      setMeasLine(null);
      setStage("upload");
    }
  }, [open]);

  const refMm = useMemo(() => {
    const r = PHOTO_REFERENCES.find((p) => p.key === refKey);
    if (!r) return null;
    if (r.mm != null) return r.mm;
    const n = parseFloat(customMm);
    return isFinite(n) && n > 0 ? n : null;
  }, [refKey, customMm]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDataUrl) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const maxW = Math.min(720, containerRef.current?.clientWidth || 720);
      const scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      canvas.width = w; canvas.height = h;
      setImgDims({ w, h });
      ctx.drawImage(img, 0, 0, w, h);
      if (refLine) drawLine(ctx, refLine, "#60a5fa", "Reference");
      if (measLine) drawLine(ctx, measLine, "#c084fc", "Measure");
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, refLine, measLine]);
  useEffect(() => { draw(); }, [draw]);

  function drawLine(ctx, line, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(line.a.x, line.a.y);
    ctx.lineTo(line.b.x, line.b.y);
    ctx.stroke();
    for (const p of [line.a, line.b]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0d";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.font = "600 12px ui-sans-serif, system-ui";
    ctx.fillText(label, Math.min(line.a.x, line.b.x), Math.min(line.a.y, line.b.y) - 10);
    ctx.restore();
  }

  function canvasPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches?.[0];
    const clientX = t ? t.clientX : e.clientX;
    const clientY = t ? t.clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onPointerDown(e) {
    if (!imageDataUrl) return;
    const pt = canvasPoint(e);
    for (const [key, line] of [["ref", refLine], ["meas", measLine]]) {
      if (!line) continue;
      if (dist(pt, line.a) < 16) { setDrag({ which: key, endpoint: "a" }); return; }
      if (dist(pt, line.b) < 16) { setDrag({ which: key, endpoint: "b" }); return; }
    }
    if (stage === "reference" || !refLine) {
      setRefLine({ a: pt, b: pt });
      setDrag({ which: "ref", endpoint: "b" });
      setStage("reference");
    } else {
      setMeasLine({ a: pt, b: pt });
      setDrag({ which: "meas", endpoint: "b" });
      setStage("measure");
    }
  }
  function onPointerMove(e) {
    if (!drag) return;
    e.preventDefault?.();
    const pt = canvasPoint(e);
    if (drag.which === "ref") setRefLine((l) => ({ ...(l || {}), [drag.endpoint]: pt }));
    else setMeasLine((l) => ({ ...(l || {}), [drag.endpoint]: pt }));
  }
  function onPointerUp() {
    setDrag(null);
    if (refLine && measLine) setStage("done");
    else if (refLine) setStage("measure");
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result);
      setStage("reference");
      setRefLine(null);
      setMeasLine(null);
    };
    reader.onerror = () => {};
    reader.readAsDataURL(file);
  }

  const refPx = refLine ? dist(refLine.a, refLine.b) : 0;
  const measPx = measLine ? dist(measLine.a, measLine.b) : 0;
  const mmPerPx = refPx > 0 && refMm ? refMm / refPx : 0;
  const measMm = measPx * mmPerPx;
  const measInches = measMm / MM_PER_IN;
  const confidence = refPx < 40 ? "low" : refPx < 120 ? "medium" : "good";
  const confMsg = {
    low:    "Low confidence — the reference is fewer than 40 display pixels wide. Zoom in and retry for an accurate reading.",
    medium: "OK confidence — the reference is readable but small. Aim for a reference that's at least 120 px long.",
    good:   "Good confidence — reference is comfortably sized.",
  }[confidence];

  const showDisplay = measLine && mmPerPx > 0;
  const displayStr = showDisplay
    ? (unitMode === "mm" ? `${measMm.toFixed(1)} mm` : `${measInches.toFixed(2)}"`)
    : "—";

  function applyInchesTo(field) {
    if (!showDisplay) return;
    const inches = measInches.toFixed(3);
    onApply(field, inches);
    pushMeasurementHistory(field === "id1" ? "id1" : field === "id2" ? "id2" : "len", inches);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-3xl">
        <div className="px-5 pb-5 pt-6">
          <DialogHeader>
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Measure from photo</div>
            <DialogTitle className="mt-1 text-xl font-semibold text-white">
              Upload a photo with a reference object
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Include a credit card, coin, or other known-size item in the shot.
              Tap to draw the reference line first, then the measurement line.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
            <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {!imageDataUrl ? (
                <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center text-sm text-zinc-400 transition hover:border-violet-400/40 hover:text-white">
                  <span className="sr-only">Upload a photo to measure from</span>
                  <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
                  <Plus className="h-8 w-8 text-zinc-500" />
                  <div aria-hidden="true">Tap to choose or take a photo</div>
                  <div className="text-[11px] text-zinc-600" aria-hidden="true">JPG, PNG, WebP · HEIC may need conversion first</div>
                </label>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="block w-full touch-none"
                  onMouseDown={onPointerDown}
                  onMouseMove={onPointerMove}
                  onMouseUp={onPointerUp}
                  onMouseLeave={onPointerUp}
                  onTouchStart={onPointerDown}
                  onTouchMove={onPointerMove}
                  onTouchEnd={onPointerUp}
                />
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="photo-ref-select" className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Reference object</label>
                <select
                  id="photo-ref-select"
                  value={refKey}
                  onChange={(e) => setRefKey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-100 focus:border-violet-400/50 focus:outline-none"
                >
                  {PHOTO_REFERENCES.map((r) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
                {refKey === "custom" && (
                  <input
                    type="number"
                    aria-label="Custom reference length in millimetres"
                    inputMode="decimal"
                    step="0.1"
                    min="1"
                    value={customMm}
                    onChange={(e) => setCustomMm(e.target.value)}
                    placeholder="Known length in mm"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none"
                  />
                )}
              </div>

              {imageDataUrl && (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Measurement</div>
                    <div className="mt-1 text-xl font-semibold tabular text-white">{displayStr}</div>
                    <div className="mt-2 text-[11px] text-zinc-400">
                      Reference: {refPx.toFixed(0)} px · {refMm != null ? `${refMm.toFixed(1)} mm` : "—"}
                    </div>
                    <div className="mt-2 text-[11px] text-amber-200/80">{imageDataUrl && confMsg}</div>
                  </div>

                  <div className="grid gap-1.5">
                    <button type="button" disabled={!showDisplay} onClick={() => applyInchesTo("id1")}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-100 transition hover:border-violet-400/30 hover:bg-white/[0.08] disabled:opacity-40">
                      Apply to End 1 I.D.
                    </button>
                    <button type="button" disabled={!showDisplay} onClick={() => applyInchesTo("id2")}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-100 transition hover:border-violet-400/30 hover:bg-white/[0.08] disabled:opacity-40">
                      Apply to End 2 I.D.
                    </button>
                    <button type="button" disabled={!showDisplay} onClick={() => applyInchesTo("len")}
                      className={`rounded-xl border border-violet-400/30 bg-gradient-to-r ${ACCENT} px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-40`}>
                      Apply to Length
                    </button>
                    <button type="button" onClick={() => { setRefLine(null); setMeasLine(null); setStage("reference"); }}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-zinc-400 transition hover:border-red-400/30 hover:text-red-300">
                      Clear lines
                    </button>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-[11px] text-zinc-400 transition hover:border-violet-400/30 hover:text-white">
                      <span className="sr-only">Choose a different photo</span>
                      <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
                      Change photo
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
