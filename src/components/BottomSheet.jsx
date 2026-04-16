// Modal bottom sheet primitive — slide up from the edge of the viewport,
// drag-down to dismiss, tap-backdrop to dismiss. Locks body scroll and
// closes on Escape. Used by the mobile filter panel (historical; the
// unified-mode Refine disclosure subsumed it) and available for any
// future sheet surface.

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getFocusable, trapTab, restoreFocusOnUnmount } from "../lib/focusTrap.js";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   children?: React.ReactNode,
 * }} props
 */
export function BottomSheet({ open, onClose, title, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const restore = restoreFocusOnUnmount();
    const onKey = (e) => {
      if (e.key === "Escape") { onClose?.(); return; }
      if (e.key === "Tab" && panelRef.current) trapTab(e, panelRef.current);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = getFocusable(panel);
      const first = focusables.find((el) => el.getAttribute("aria-label") !== "Close filters")
        || focusables[0]
        || panel;
      first?.focus?.({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      restore();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Filters"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose?.();
            }}
            className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border-t border-white/10 bg-zinc-950 shadow-[0_-24px_80px_-12px_rgba(0,0,0,0.85)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-zinc-950/80 px-5 pb-3 pt-2 backdrop-blur">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between gap-3 px-5 pt-2">
              <div className="text-sm font-semibold text-white">{title || "Filters"}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:border-violet-400/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(88vh-3.5rem)] overflow-y-auto px-2 pb-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
