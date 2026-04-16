// Compare tray + modal state. The mobile exclusivity rule (compare and
// shortlist bars overlap when both expanded) is parameterised via
// `onOpenWhileMobile` — the callsite passes `() => setShortlistOpen(false)`
// so this hook stays decoupled from shortlist internals.

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * @param {{
 *   allHoses: any[],
 *   isMobile: boolean,
 *   onOpenWhileMobile?: () => void,
 * }} opts
 */
export function useCompare({ allHoses, isMobile, onOpenWhileMobile }) {
  const [compare, setCompare] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const openCompareExclusive = useCallback((updater) => {
    setCompareOpen((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next && isMobile) onOpenWhileMobile?.();
      return next;
    });
  }, [isMobile, onOpenWhileMobile]);

  const toggleCompare = useCallback((partNo) => {
    setCompare((prev) => {
      if (prev.includes(partNo)) return prev.filter((p) => p !== partNo);
      openCompareExclusive(true);
      return [...prev.slice(-2), partNo];
    });
  }, [openCompareExclusive]);

  useEffect(() => {
    if (compare.length === 0) setCompareOpen(false);
  }, [compare.length]);

  const compared = useMemo(
    () => allHoses.filter((h) => compare.includes(h.partNo)),
    [allHoses, compare],
  );

  return {
    compare,
    setCompare,
    compareOpen,
    openCompareExclusive,
    compareModalOpen,
    setCompareModalOpen,
    toggleCompare,
    compared,
  };
}
