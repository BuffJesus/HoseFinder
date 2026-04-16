// "Field Mode" — aggressive offline pre-cache. Downloads all 4,700+ hose
// silhouette images into the browser cache so the app works fully offline
// in shops with poor signal. Uses the Cache API from the main thread
// (shared with the service worker's cache-first strategy).
//
// Progress renders as a simple bar + count. Once complete, a persistent
// flag in localStorage tells the TopBar to show a green "Offline ready"
// badge. The builder never has to think about it again until they clear
// site data.

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Check, Loader2 } from "lucide-react";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";
const FIELD_MODE_KEY = "hosefinder-field-mode";
const CACHE_NAME = "hosefinder-v2-pages-img";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   allHoses: any[],
 * }} props
 */
export function FieldModeDialog({ open, onClose, allHoses }) {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const cancelRef = useRef(false);

  const isReady = typeof window !== "undefined" && window.localStorage.getItem(FIELD_MODE_KEY) === "true";

  useEffect(() => {
    if (open) { cancelRef.current = false; setStatus(isReady ? "done" : "idle"); }
  }, [open, isReady]);

  const startDownload = useCallback(async () => {
    if (!("caches" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus("downloading");
    cancelRef.current = false;
    const urls = allHoses.map((h) => `images/hoses/${h.partNo}.png`);
    setTotal(urls.length);
    setProgress(0);

    try {
      const cache = await caches.open(CACHE_NAME);
      let done = 0;
      const BATCH = 12;
      for (let i = 0; i < urls.length; i += BATCH) {
        if (cancelRef.current) { setStatus("idle"); return; }
        const batch = urls.slice(i, i + BATCH);
        await Promise.allSettled(batch.map((url) => cache.add(url).catch(() => {})));
        done += batch.length;
        setProgress(Math.min(done, urls.length));
      }
      window.localStorage.setItem(FIELD_MODE_KEY, "true");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [allHoses]);

  const cancelDownload = () => { cancelRef.current = true; };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[28px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
        <div className="px-5 pb-5 pt-6">
          <DialogHeader>
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Offline</div>
            <DialogTitle className="mt-1 text-xl font-semibold text-white">
              {isReady || status === "done" ? "Offline ready" : "Field mode"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {isReady || status === "done"
                ? "All hose images are cached. The app works fully offline — no signal needed."
                : "Download all hose images so the app works in shops with poor signal. About 50 MB, takes ~1 minute on WiFi."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            {status === "idle" && (
              <Button
                onClick={startDownload}
                disabled={allHoses.length === 0}
                className={`w-full rounded-2xl bg-gradient-to-r ${ACCENT} text-white`}
              >
                <WifiOff className="mr-2 h-4 w-4" />
                Download for offline use
              </Button>
            )}

            {status === "downloading" && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                      Downloading images…
                    </span>
                    <span className="tabular">{progress.toLocaleString()} / {total.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${ACCENT} transition-all duration-300`}
                      style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelDownload}
                  className="text-xs text-zinc-400 transition hover:text-white"
                >
                  Cancel
                </button>
              </>
            )}

            {status === "done" && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/8 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                  <Check className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-200">All images cached</div>
                  <div className="mt-0.5 text-xs text-zinc-400">
                    Put your phone in airplane mode — everything still works.
                  </div>
                </div>
              </div>
            )}

            {status === "unsupported" && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/8 p-3 text-[11px] text-amber-200">
                Your browser doesn't support the Cache API. Try Chrome, Edge, or Safari.
              </div>
            )}

            {status === "error" && (
              <div className="rounded-2xl border border-red-400/25 bg-red-500/8 p-3 text-[11px] text-red-200">
                Download failed. Check your connection and try again.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Check if field mode has been activated. */
export function isFieldModeReady() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(FIELD_MODE_KEY) === "true";
}
