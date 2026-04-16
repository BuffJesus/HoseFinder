// Tracks the last N hose partNos the user opened, persisted to
// localStorage. Consumers supply the current `selected` partNo and the
// hook automatically prepends it on change (no duplicate entries).

import { useEffect, useMemo, useState } from "react";

const RECENT_VIEWED_KEY = "hosefinder-recent";
const RECENT_VIEWED_LIMIT = 8;

function loadRecent() {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_VIEWED_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter((partNo) => typeof partNo === "string") : [];
  } catch { return []; }
}

/**
 * @param {{ selectedPartNo: string | null | undefined, allHoses: any[] }} opts
 * @returns {{ recentPartNos: string[], recentHoses: any[] }}
 */
export function useRecentlyViewed({ selectedPartNo, allHoses }) {
  const [recentPartNos, setRecentPartNos] = useState(loadRecent);

  useEffect(() => {
    if (!selectedPartNo || typeof window === "undefined") return;
    setRecentPartNos((prev) => {
      const next = [selectedPartNo, ...prev.filter((p) => p !== selectedPartNo)]
        .slice(0, RECENT_VIEWED_LIMIT);
      try {
        window.localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [selectedPartNo]);

  const recentHoses = useMemo(
    () => recentPartNos.map((p) => allHoses.find((h) => h.partNo === p)).filter(Boolean),
    [allHoses, recentPartNos],
  );

  return { recentPartNos, recentHoses };
}
