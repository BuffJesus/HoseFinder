// Per-field history of recent measurement values, persisted to localStorage.
// Shape: `{ [fieldKey]: [{ inches: string, at: number }] }`. Values are kept
// in canonical inches so the history survives a unit-toggle flip.
//
// Entries older than MAX_AGE get pruned on every load — no separate sweep.

/** @typedef {{ inches: string, at: number }} HistoryEntry */
/** @typedef {Record<string, HistoryEntry[]>} HistoryMap */

export const MEASUREMENT_HISTORY_KEY = "hosefinder-measurement-history";
export const MEASUREMENT_HISTORY_LIMIT = 5;
export const MEASUREMENT_HISTORY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** @returns {HistoryMap} */
export function loadMeasurementHistory() {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(window.localStorage.getItem(MEASUREMENT_HISTORY_KEY) || "{}");
    const now = Date.now();
    /** @type {HistoryMap} */
    const pruned = {};
    for (const [key, list] of Object.entries(raw)) {
      if (!Array.isArray(list)) continue;
      pruned[key] = list.filter(
        (e) => e && typeof e.inches === "string" && typeof e.at === "number"
          && (now - e.at) < MEASUREMENT_HISTORY_MAX_AGE_MS,
      );
    }
    return pruned;
  } catch {
    return {};
  }
}

/** @param {HistoryMap} data */
export function saveMeasurementHistory(data) {
  try { window.localStorage.setItem(MEASUREMENT_HISTORY_KEY, JSON.stringify(data)); } catch {}
}

/**
 * @param {string} historyKey
 * @param {string} inchesStr
 */
export function pushMeasurementHistory(historyKey, inchesStr) {
  if (!historyKey || !inchesStr) return;
  const all = loadMeasurementHistory();
  const existing = (all[historyKey] || []).filter((e) => e.inches !== inchesStr);
  const next = [{ inches: inchesStr, at: Date.now() }, ...existing].slice(0, MEASUREMENT_HISTORY_LIMIT);
  all[historyKey] = next;
  saveMeasurementHistory(all);
}

/** @param {number} ms millisecond timestamp (e.g. `Date.now()`-style) */
export function formatRelativeTime(ms) {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
