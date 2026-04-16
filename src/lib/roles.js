// Role taxonomy + share-URL (de)serialisation. No React, no DOM — pure
// plumbing that the UI layer composes against. Storing roles as the short
// code "custom:<label>" lets users name a free-form role inline while the
// grouping keys stay stable ("custom" for every free-form entry).

/** @typedef {{ key: string, label: string }} RoleDef */

/** @type {ReadonlyArray<RoleDef>} Canonical roles in coolant-system order. */
export const ROLES = [
  { key: "upper-radiator", label: "Upper radiator" },
  { key: "lower-radiator", label: "Lower radiator" },
  { key: "heater-feed",    label: "Heater feed" },
  { key: "heater-return",  label: "Heater return" },
  { key: "bypass",         label: "Bypass" },
  { key: "degas-overflow", label: "Degas / overflow" },
  { key: "branched",       label: "Branched / tee" },
  { key: "custom",         label: "Custom" },
];

/** @type {Record<string, string>} key → human label. */
export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

/** A build without these is probably incomplete — drives the "missing roles" banner. */
export const CANONICAL_ROLES_FOR_COMPLETE_BUILD = ["upper-radiator", "lower-radiator"];

/**
 * Normalise a raw role string (may be "custom:My Label") to its group key.
 * @param {string|null|undefined} raw
 * @returns {string|null}
 */
export function roleKey(raw) {
  if (!raw) return null;
  return (raw === "custom" || raw.startsWith("custom:")) ? "custom" : raw;
}

/**
 * Human label for a role — expands "custom:X" → "X".
 * @param {string|null|undefined} raw
 */
export function roleDisplay(raw) {
  if (!raw) return "";
  if (raw === "custom") return "Custom";
  if (raw.startsWith("custom:")) return raw.slice(7);
  return ROLE_LABEL[raw] || "";
}

// ─── Shareable-URL codec ─────────────────────────────────────────────────

/** @type {Record<string, string>} canonical role key → 2-letter short code */
export const ROLE_SHORT = {
  "upper-radiator": "ur", "lower-radiator": "lr",
  "heater-feed":    "hf", "heater-return":  "hr",
  "bypass":         "by", "degas-overflow": "do",
  "branched":       "br", "custom":         "c",
};
/** @type {Record<string, string>} inverse of ROLE_SHORT */
export const ROLE_FROM_SHORT = Object.fromEntries(
  Object.entries(ROLE_SHORT).map(([k, v]) => [v, k]),
);

/**
 * @typedef {{ id?: string, name: string, partNos: string[], roles?: Record<string,string> }} Project
 * @typedef {{ name: string, partNos: string[], roles: Record<string,string> }} SharePayload
 */

/**
 * Encode a project to a compact `#/share?...` hash. Drops notes on purpose
 * — notes are private and would blow out the URL length.
 * @param {Project} project
 */
export function encodeProjectShare(project) {
  const parts = project.partNos.map((partNo) => {
    const raw = (project.roles || {})[partNo];
    const short = raw ? ROLE_SHORT[roleKey(raw)] : "";
    return short ? `${partNo}:${short}` : partNo;
  }).join(",");
  const p = new URLSearchParams();
  p.set("n", project.name);
  p.set("h", parts);
  return `#/share?${p.toString()}`;
}

/**
 * Parse a `#/share?...` hash. Returns null when the hash doesn't match or
 * contains no parts. Unknown short codes are ignored (partNo is kept
 * without a role assignment) rather than failing the whole payload.
 * @param {string} [hash]
 * @returns {SharePayload | null}
 */
export function parseShareHash(hash) {
  const s = hash || (typeof window !== "undefined" ? window.location.hash : "");
  const m = s.match(/^#\/share\?(.*)$/);
  if (!m) return null;
  const p = new URLSearchParams(m[1]);
  const name = (p.get("n") || "Shared project").trim().slice(0, 60);
  const partsStr = p.get("h") || "";
  /** @type {string[]} */
  const partNos = [];
  /** @type {Record<string,string>} */
  const roles = {};
  for (const token of partsStr.split(",")) {
    if (!token) continue;
    const [partNo, short] = token.split(":");
    if (!partNo) continue;
    partNos.push(partNo);
    if (short && ROLE_FROM_SHORT[short]) roles[partNo] = ROLE_FROM_SHORT[short];
  }
  if (partNos.length === 0) return null;
  return { name, partNos, roles };
}
