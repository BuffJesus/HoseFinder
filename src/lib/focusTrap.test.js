// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getFocusable, trapTab, restoreFocusOnUnmount } from "./focusTrap.js";

function dispatchTab(shift = false) {
  const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: shift, bubbles: true, cancelable: true });
  return event;
}

describe("focusTrap", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("getFocusable returns visible focusables in order", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <a href="#a" id="a">a</a>
      <button id="b">b</button>
      <button id="c" disabled>c</button>
      <input id="d" type="hidden" />
      <input id="e" />
      <div tabindex="0" id="f"></div>
      <div tabindex="-1" id="g"></div>
    `;
    document.body.appendChild(root);
    const ids = getFocusable(root).map((el) => el.id);
    expect(ids).toEqual(["a", "b", "e", "f"]);
  });

  it("trapTab wraps from last to first on forward Tab", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <button id="first">first</button>
      <button id="last">last</button>
    `;
    document.body.appendChild(root);
    const last = /** @type {HTMLButtonElement} */ (root.querySelector("#last"));
    last.focus();
    expect(document.activeElement).toBe(last);
    const e = dispatchTab(false);
    trapTab(e, root);
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(root.querySelector("#first"));
  });

  it("trapTab wraps from first to last on shift-Tab", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <button id="first">first</button>
      <button id="last">last</button>
    `;
    document.body.appendChild(root);
    const first = /** @type {HTMLButtonElement} */ (root.querySelector("#first"));
    first.focus();
    const e = dispatchTab(true);
    trapTab(e, root);
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(root.querySelector("#last"));
  });

  it("trapTab does nothing special in the middle of the ring", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <button id="a">a</button>
      <button id="b">b</button>
      <button id="c">c</button>
    `;
    document.body.appendChild(root);
    const b = /** @type {HTMLButtonElement} */ (root.querySelector("#b"));
    b.focus();
    const e = dispatchTab(false);
    trapTab(e, root);
    expect(e.defaultPrevented).toBe(false);
  });

  it("restoreFocusOnUnmount returns focus to the previous element", () => {
    const before = document.createElement("button");
    before.id = "before";
    document.body.appendChild(before);
    before.focus();
    expect(document.activeElement).toBe(before);

    const restore = restoreFocusOnUnmount();
    const modal = document.createElement("button");
    document.body.appendChild(modal);
    modal.focus();
    expect(document.activeElement).toBe(modal);

    restore();
    expect(document.activeElement).toBe(before);
  });

  it("restoreFocusOnUnmount is safe when previous element was removed", () => {
    const before = document.createElement("button");
    document.body.appendChild(before);
    before.focus();
    const restore = restoreFocusOnUnmount();
    before.remove();
    expect(() => restore()).not.toThrow();
  });
});
