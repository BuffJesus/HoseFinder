// Transient toast queue — keeps the last 4 entries, auto-expires each
// after its own timer. Toasts with an `action` live 5s (so the Undo has
// time to be clicked); silent toasts live 2.4s.

import { useCallback, useState } from "react";

/**
 * @returns {{ toasts: any[], pushToast: (message: string, opts?: any) => void }}
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((message, opts = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = opts.duration || (opts.action ? 5000 : 2400);
    const entry = { id, message, ...opts };
    if (opts.action) {
      entry.action = {
        label: opts.action.label,
        onClick: () => {
          opts.action.onClick?.();
          setToasts((prev) => prev.filter((t) => t.id !== id));
        },
      };
    }
    setToasts((prev) => [...prev.slice(-3), entry]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);
  return { toasts, pushToast };
}
