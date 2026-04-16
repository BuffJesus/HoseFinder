import React, { createContext, useContext, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getFocusable, trapTab, restoreFocusOnUnmount } from "../../lib/focusTrap.js";

const DialogContext = createContext({ open: false, onOpenChange: () => {} });

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({ className = "", children, ...props }) {
  const { open, onOpenChange } = useContext(DialogContext);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const restore = restoreFocusOnUnmount();
    const onKey = (e) => {
      if (e.key === "Escape") { onOpenChange?.(false); return; }
      if (e.key === "Tab" && panelRef.current) trapTab(e, panelRef.current);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = getFocusable(panel);
      const first = focusables.find((el) => !el.hasAttribute("data-dialog-close"))
        || focusables[0]
        || panel;
      first?.focus?.({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restore();
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => onOpenChange?.(false)}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className={join(
              "relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]",
              className,
            )}
            {...props}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
            <button
              type="button"
              aria-label="Close dialog"
              data-dialog-close=""
              onClick={() => onOpenChange?.(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 backdrop-blur transition hover:border-violet-400/40 hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ className = "", ...props }) {
  return <div className={join("space-y-1.5", className)} {...props} />;
}

export function DialogTitle({ className = "", ...props }) {
  return <h2 className={join("text-xl font-semibold tracking-tight text-white", className)} {...props} />;
}

export function DialogDescription({ className = "", ...props }) {
  return <p className={join("text-sm text-zinc-400", className)} {...props} />;
}
