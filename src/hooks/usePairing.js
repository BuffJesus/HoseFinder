// "Often added alongside" — derives a co-occurrence index across the
// user's projects (no separate storage, no cross-device tracking) and
// turns it into ranked suggestions for the currently selected hose.
// Users can disable pairing entirely; the choice persists in localStorage.

import { useCallback, useEffect, useMemo, useState } from "react";

const PAIRING_DISABLED_KEY = "hosefinder-pairing-disabled";

function loadDisabled() {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(PAIRING_DISABLED_KEY) === "1"; } catch { return false; }
}

/**
 * @param {{
 *   projects: any[],
 *   selected: any | null,
 *   allHoses: any[],
 *   targetId: number | string,
 *   idTolerance: number,
 * }} opts
 */
export function usePairing({ projects, selected, allHoses, targetId, idTolerance }) {
  const [pairingDisabled, setPairingDisabled] = useState(loadDisabled);

  useEffect(() => {
    try { window.localStorage.setItem(PAIRING_DISABLED_KEY, pairingDisabled ? "1" : "0"); } catch {}
  }, [pairingDisabled]);

  const disablePairing = useCallback(() => {
    if (!window.confirm("Disable 'Often added alongside' suggestions? Pairing data is all local and will be ignored from now on.")) return;
    setPairingDisabled(true);
  }, []);

  const pairIndex = useMemo(() => {
    if (pairingDisabled) return null;
    const index = {};
    for (const p of projects) {
      const unique = Array.from(new Set(p.partNos));
      if (unique.length < 2) continue;
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const a = unique[i], b = unique[j];
          (index[a] ||= {})[b] = (index[a][b] || 0) + 1;
          (index[b] ||= {})[a] = (index[b][a] || 0) + 1;
        }
      }
    }
    return index;
  }, [projects, pairingDisabled]);

  const pairSuggestions = useMemo(() => {
    if (!selected || !pairIndex || projects.length < 2) return [];
    const partners = pairIndex[selected.partNo];
    if (!partners) return [];
    const target = parseFloat(targetId);
    const respectsIdFilter = (h) => {
      if (isNaN(target)) return true;
      if (!h.endSizes?.length) return true;
      return h.endSizes.some((s) => Math.abs(s - target) <= idTolerance);
    };
    return Object.entries(partners)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([partNo, count]) => {
        const hose = allHoses.find((h) => h.partNo === partNo);
        return hose && respectsIdFilter(hose) ? { hose, count } : null;
      })
      .filter(Boolean)
      .slice(0, 3);
  }, [selected, pairIndex, projects.length, allHoses, targetId, idTolerance]);

  return { pairingDisabled, disablePairing, pairSuggestions };
}
