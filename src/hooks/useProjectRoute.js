// Hash-based deep link for project BOM: `#/project/:id`. Listens for
// hashchange so copy/pasted links work without a page reload. `openProjectBom`
// navigates; `closeProjectBom` pops the hash cleanly without adding a
// duplicate entry to history.

import { useCallback, useEffect, useState } from "react";

function parseProjectHash() {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/^#\/project\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * @param {{ onOpen?: () => void }} [opts]
 * @returns {{
 *   viewProjectId: string | null,
 *   openProjectBom: (id: string) => void,
 *   closeProjectBom: () => void,
 * }}
 */
export function useProjectRoute(opts = {}) {
  const [viewProjectId, setViewProjectId] = useState(parseProjectHash);
  useEffect(() => {
    const onHash = () => setViewProjectId(parseProjectHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const openProjectBom = useCallback((id) => {
    window.location.hash = `#/project/${id}`;
    opts.onOpen?.();
  }, [opts]);

  const closeProjectBom = useCallback(() => {
    if (window.location.hash.startsWith("#/project/")) {
      window.history.pushState(null, "", window.location.pathname + window.location.search);
    }
    setViewProjectId(null);
  }, []);

  return { viewProjectId, openProjectBom, closeProjectBom };
}
