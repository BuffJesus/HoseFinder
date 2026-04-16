// Subscribes to a CSS media query and re-renders on match changes. SSR-safe
// (returns `false` when `window` is unavailable). Falls back to deprecated
// `addListener`/`removeListener` for Safari < 14.

import { useEffect, useState } from "react";

/**
 * @param {string} query — a CSS media query string, e.g. `(max-width: 767px)`
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const get = () => (typeof window !== "undefined" && window.matchMedia(query).matches);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange) ?? mql.addListener(onChange);
    return () => mql.removeEventListener?.("change", onChange) ?? mql.removeListener(onChange);
  }, [query]);
  return matches;
}
