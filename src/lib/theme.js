// Semantic colour tokens — exactly five meanings, one palette per meaning.
// Adopted from the Tuner ux-design pattern: a token names *intent*, not the
// shade. Code reads as "tone.ok" (intent) instead of "emerald-500" (choice),
// so the day we decide "ok" should be teal instead of emerald, the change
// happens in one place.
//
// The rules:
// - If you need a new meaning, add a token here with a one-line rationale.
// - If you reach for a sixth hue, the answer is probably "collapse two of the
//   existing tones" rather than "add a new one."
// - `special` is deliberately rare — it should feel distinct when it appears.

/** @typedef {"primary" | "ok" | "warning" | "danger" | "special"} Tone */

/**
 * Hex reference values for each tone. Use directly when you need a raw colour
 * (e.g. SVG fill, canvas stroke, inline style) rather than a Tailwind class.
 * @type {Record<Tone, string>}
 */
export const TONE_HEX = Object.freeze({
  primary: "#8b5cf6", // violet-500 — brand accent, primary CTA, selection state
  ok:      "#10b981", // emerald-500 — value inside a healthy zone, "exact fit"
  warning: "#f59e0b", // amber-500 — attention needed, within-range / approximate
  danger:  "#f43f5e", // rose-500 — destructive, error, shortlist limit reached
  special: "#0ea5e9", // sky-500 — informational, "close fit", rare by design
});

/**
 * Tailwind colour family each tone draws from. These are the classes
 * components should reach for when they reference a tone. Keeping the
 * palette names catalogued here (rather than scattered in JSX) is the point:
 * the next time we ship a surface, the reader of this file can see which
 * family to pull from without re-inventing a scheme.
 * @type {Record<Tone, { family: string, hueClass: string, borderClass: string }>}
 */
export const TONE_TAILWIND = Object.freeze({
  primary: { family: "violet",  hueClass: "text-violet-300",  borderClass: "border-violet-400/30"  },
  ok:      { family: "emerald", hueClass: "text-emerald-300", borderClass: "border-emerald-400/30" },
  warning: { family: "amber",   hueClass: "text-amber-300",   borderClass: "border-amber-400/30"   },
  danger:  { family: "rose",    hueClass: "text-rose-300",    borderClass: "border-rose-400/30"    },
  special: { family: "sky",     hueClass: "text-sky-300",     borderClass: "border-sky-400/30"     },
});

/**
 * Brand gradient — the one multi-hue accent kept for hero CTAs and the brand
 * identity itself. Never mix with tone.special; gradient usage is reserved
 * for the brand surface so it stays load-bearing.
 */
export const BRAND_GRADIENT = "from-violet-500 via-fuchsia-500 to-purple-500";
