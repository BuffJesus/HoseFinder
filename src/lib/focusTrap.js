// Minimal focus-trap helpers for modal surfaces (Dialog, BottomSheet).
// Keeps Tab/Shift-Tab inside a container and restores focus to whatever
// element was focused before the modal opened.

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Enumerate focusable descendants of `root`. Skips elements that are
 * explicitly hidden (`hidden`, `aria-hidden="true"`, `inert`). Does not
 * check layout — jsdom has no layout engine, so we stay conservative and
 * let the browser's native focus model handle display:none cases at runtime.
 * @param {HTMLElement} root
 * @returns {HTMLElement[]}
 */
export function getFocusable(root) {
  if (!root) return [];
  const nodes = /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)));
  return nodes.filter((el) => {
    if (el.hidden) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    if (el.hasAttribute("inert")) return false;
    return true;
  });
}

/**
 * Handle a Tab keydown by wrapping focus at the ends of the focusable list.
 * No-op if there are no focusable descendants.
 * @param {KeyboardEvent} event
 * @param {HTMLElement} root
 */
export function trapTab(event, root) {
  const items = getFocusable(root);
  if (items.length === 0) {
    event.preventDefault();
    root.focus?.();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = (typeof document !== "undefined" ? document.activeElement : null);
  if (event.shiftKey) {
    if (active === first || !root.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Capture the currently focused element and return a function that
 * restores focus to it. Safe to call when no element is focused or when
 * the captured element has since been removed from the DOM.
 * @returns {() => void}
 */
export function restoreFocusOnUnmount() {
  if (typeof document === "undefined") return () => {};
  const previous = /** @type {HTMLElement|null} */ (document.activeElement);
  return () => {
    if (!previous) return;
    if (typeof previous.focus !== "function") return;
    if (!document.contains(previous)) return;
    try { previous.focus({ preventScroll: true }); } catch { /* empty */ }
  };
}
