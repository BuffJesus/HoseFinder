// Global keyboard shortcuts. Listens on `window` and dispatches to the
// callbacks passed in. Intentionally NOT wrapping in useCallback / stable
// refs — the effect re-binds when callbacks change, which is fine at this
// scale (shortcuts fire at human speed, not render speed).
//
// Typing into an `<input>`, `<textarea>`, `<select>`, or contenteditable
// element suppresses all shortcuts so users don't trigger "s" / "c" / "g"
// while typing a part number.

import { useEffect } from "react";

/**
 * @typedef {{
 *   focusSearch?: () => void,
 *   toggleShortlist?: () => void,
 *   toggleCompare?: () => void,
 *   setViewMode?: (mode: "grid" | "list" | "compact") => void,
 *   scrollToTop?: () => void,
 *   showHelp?: () => void,
 * }} ShortcutHandlers
 */

/**
 * Pure dispatcher: given an event and a handlers object, invoke the matching
 * handler (if any) and mark the event as handled. Exported for unit tests.
 * @param {KeyboardEvent} event
 * @param {ShortcutHandlers} handlers
 * @returns {boolean} true iff a handler fired
 */
export function dispatchShortcut(event, handlers) {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  const target = /** @type {HTMLElement | null} */ (event.target);
  const tag = target?.tagName;
  const editable = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable;
  if (editable) return false;

  let handled = true;
  switch (event.key) {
    case "/":  handlers.focusSearch?.();       break;
    case "s":  handlers.toggleShortlist?.();   break;
    case "c":  handlers.toggleCompare?.();     break;
    case "1":  handlers.setViewMode?.("grid"); break;
    case "2":  handlers.setViewMode?.("list"); break;
    case "3":  handlers.setViewMode?.("compact"); break;
    case "g":  handlers.scrollToTop?.();       break;
    case "?":  handlers.showHelp?.();          break;
    default:
      handled = false;
  }
  if (handled) event.preventDefault();
  return handled;
}

/** @param {ShortcutHandlers} handlers */
export function useKeyboardShortcuts(handlers) {
  const {
    focusSearch, toggleShortlist, toggleCompare,
    setViewMode, scrollToTop, showHelp,
  } = handlers;

  useEffect(() => {
    const onKey = (e) => dispatchShortcut(e, {
      focusSearch, toggleShortlist, toggleCompare,
      setViewMode, scrollToTop, showHelp,
    });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusSearch, toggleShortlist, toggleCompare, setViewMode, scrollToTop, showHelp]);
}
