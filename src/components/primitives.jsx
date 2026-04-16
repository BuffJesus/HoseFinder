// Small visual primitives. Stateless, context-free. Kept in one file so
// finding them is easy and imports in the main component stay tight.

import React from "react";

// Kept in sync with ACCENT in CoolantHoseFinder.jsx. Inlining avoids a
// circular import back into the root.
const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/** @typedef {"exact"|"close"|"approx"|null} MatchQuality */

/** @param {{ quality: MatchQuality }} props */
export function MatchBadge({ quality }) {
  if (!quality) return null;
  const config = {
    exact: {
      label: "Exact fit",
      cls: "border-emerald-400/30 bg-emerald-500/12 text-emerald-200 shadow-[0_4px_14px_-4px_rgba(16,185,129,0.45)]",
      dot: "bg-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
    },
    close: {
      label: "Close fit",
      cls: "border-sky-400/30 bg-sky-500/12 text-sky-200 shadow-[0_4px_14px_-4px_rgba(14,165,233,0.45)]",
      dot: "bg-sky-300 shadow-[0_0_0_3px_rgba(14,165,233,0.18)]",
    },
    approx: {
      label: "Within range",
      cls: "border-amber-400/30 bg-amber-500/12 text-amber-200 shadow-[0_4px_14px_-4px_rgba(245,158,11,0.4)]",
      dot: "bg-amber-300 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]",
    },
  }[quality];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${config.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

/** @param {{ value: number|string, max: number, tone?: "violet"|"amber" }} props */
export function CountPill({ value, max, tone = "violet" }) {
  const toneCls =
    tone === "violet"
      ? `bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.55)]`
      : "bg-gradient-to-r from-amber-500 to-orange-400 text-zinc-950 shadow-[0_4px_14px_-2px_rgba(245,158,11,0.55)]";
  return (
    <span className={`inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold tabular ${toneCls}`}>
      {value}<span className="opacity-60">/{max}</span>
    </span>
  );
}

/** @param {{ children: React.ReactNode, className?: string }} props */
export function Kbd({ children, className = "" }) {
  return (
    <kbd className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md border border-white/15 bg-white/[0.06] px-1.5 font-mono text-[10px] text-zinc-200 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] ${className}`.trim()}>
      {children}
    </kbd>
  );
}

// Inch → mm hint, shown next to a diameter value so non-imperial users have a
// quick reference. Internal state stays in inches.
/** @param {{ value: string|number, className?: string }} props */
export function MmHint({ value, className = "" }) {
  const n = parseFloat(String(value));
  if (isNaN(n) || n <= 0) return null;
  return (
    <span className={`tabular text-zinc-500 ${className}`.trim()}>
      ≈ {(n * 25.4).toFixed(1)} mm
    </span>
  );
}

// Self-contained 360° viewer mark — circular arrow + "360" caption. Rendered
// inline so we don't hotlink external gallery-thumbnail assets.
/** @param {{ className?: string }} props */
export function Viewer360Icon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="14" rx="9" ry="3.5" />
      <path d="M3 14a9 3.5 0 0 0 18 0" />
      <text
        x="12"
        y="10"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        360°
      </text>
    </svg>
  );
}
