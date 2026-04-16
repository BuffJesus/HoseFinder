// Named filter snapshots, persisted to localStorage. Capped at the most
// recent N entries so the strip stays scrollable. Saving the same name
// overwrites — that matches the way users actually iterate ("save",
// tweak, "save" again with the same label). Apply / share / capture
// actions live at the call site since they reach into filter state +
// the wizard step machine.

import { useCallback, useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

const SAVED_SEARCHES_KEY = "hosefinder-saved-searches";
const SAVED_SEARCHES_LIMIT = 12;

function loadSavedSearches() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_SEARCHES_KEY) || "[]");
  } catch { return []; }
}

/**
 * @param {{ pushToast: (message: string, opts?: any) => void }} opts
 */
export function useSavedSearches({ pushToast }) {
  const [savedSearches, setSavedSearches] = useState(loadSavedSearches);

  useEffect(() => {
    try { window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches)); } catch {}
  }, [savedSearches]);

  const saveSearch = useCallback((name, params) => {
    setSavedSearches((prev) => {
      const next = [...prev.filter((s) => s.name !== name), {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        createdAt: Date.now(),
        params,
      }];
      return next.slice(-SAVED_SEARCHES_LIMIT);
    });
    pushToast(`Saved “${name}”`, { icon: Bookmark });
  }, [pushToast]);

  const removeSearch = useCallback((id) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { savedSearches, saveSearch, removeSearch };
}
