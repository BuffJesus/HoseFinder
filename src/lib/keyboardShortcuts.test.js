// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchShortcut } from "../hooks/useKeyboardShortcuts.js";

function kb(key, init = {}) {
  const target = init.target || document.body;
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  // jsdom doesn't re-target KeyboardEvent easily — stub it.
  Object.defineProperty(e, "target", { value: target });
  return e;
}

describe("dispatchShortcut", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it("maps '/' → focusSearch and marks handled", () => {
    const focusSearch = vi.fn();
    const e = kb("/");
    const handled = dispatchShortcut(e, { focusSearch });
    expect(focusSearch).toHaveBeenCalledOnce();
    expect(handled).toBe(true);
    expect(e.defaultPrevented).toBe(true);
  });

  it("maps 's'/'c' to shortlist/compare toggles", () => {
    const toggleShortlist = vi.fn();
    const toggleCompare = vi.fn();
    dispatchShortcut(kb("s"), { toggleShortlist, toggleCompare });
    dispatchShortcut(kb("c"), { toggleShortlist, toggleCompare });
    expect(toggleShortlist).toHaveBeenCalledOnce();
    expect(toggleCompare).toHaveBeenCalledOnce();
  });

  it("maps '1'/'2'/'3' to the three view modes", () => {
    const setViewMode = vi.fn();
    dispatchShortcut(kb("1"), { setViewMode });
    dispatchShortcut(kb("2"), { setViewMode });
    dispatchShortcut(kb("3"), { setViewMode });
    expect(setViewMode).toHaveBeenNthCalledWith(1, "grid");
    expect(setViewMode).toHaveBeenNthCalledWith(2, "list");
    expect(setViewMode).toHaveBeenNthCalledWith(3, "compact");
  });

  it("maps 'g' and '?'", () => {
    const scrollToTop = vi.fn();
    const showHelp = vi.fn();
    dispatchShortcut(kb("g"), { scrollToTop, showHelp });
    dispatchShortcut(kb("?"), { scrollToTop, showHelp });
    expect(scrollToTop).toHaveBeenCalledOnce();
    expect(showHelp).toHaveBeenCalledOnce();
  });

  it("no-ops when any modifier is pressed", () => {
    const toggleShortlist = vi.fn();
    const h = { toggleShortlist };
    expect(dispatchShortcut(kb("s", { ctrlKey: true }), h)).toBe(false);
    expect(dispatchShortcut(kb("s", { metaKey: true }), h)).toBe(false);
    expect(dispatchShortcut(kb("s", { altKey: true }), h)).toBe(false);
    expect(toggleShortlist).not.toHaveBeenCalled();
  });

  it("no-ops when the target is an editable element", () => {
    const toggleShortlist = vi.fn();
    for (const tag of ["INPUT", "TEXTAREA", "SELECT"]) {
      const fake = /** @type {HTMLElement} */ ({ tagName: tag, isContentEditable: false });
      const handled = dispatchShortcut(kb("s", { target: fake }), { toggleShortlist });
      expect(handled).toBe(false);
    }
    const contentEditableFake = { tagName: "DIV", isContentEditable: true };
    expect(dispatchShortcut(kb("s", { target: contentEditableFake }), { toggleShortlist })).toBe(false);
    expect(toggleShortlist).not.toHaveBeenCalled();
  });

  it("returns false and does not preventDefault on unmapped keys", () => {
    const focusSearch = vi.fn();
    const e = kb("x");
    const handled = dispatchShortcut(e, { focusSearch });
    expect(handled).toBe(false);
    expect(e.defaultPrevented).toBe(false);
    expect(focusSearch).not.toHaveBeenCalled();
  });

  it("tolerates missing handlers without crashing", () => {
    expect(() => dispatchShortcut(kb("/"), {})).not.toThrow();
    expect(() => dispatchShortcut(kb("1"), {})).not.toThrow();
  });
});
