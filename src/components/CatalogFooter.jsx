// Catalog freshness + identity wordmark footer.
//
// The pill on top carries data provenance: which PDF the catalogue came
// from, when it was modified, how many parts shipped in this extraction.
// Below it, the wordmark is the one quiet place that states what this app
// is. Intentionally tiny, dim, monochrome — not meant to compete with the
// workspace. (Pattern borrowed from Tuner's "TUNER / guided power".)

import React from "react";
import { BookOpen } from "lucide-react";

/**
 * @typedef {{
 *   pdfCreated?: string,
 *   pdfModified?: string,
 *   hoseCount?: number,
 *   source?: string,
 * }} CatalogMeta
 *
 * @param {{ meta?: CatalogMeta | null }} props
 */
export function CatalogFooter({ meta }) {
  const modified = meta?.pdfModified ? new Date(meta.pdfModified) : null;
  const monthYear = modified
    ? modified.toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : meta?.pdfCreated || "";
  return (
    <footer className="mx-auto mt-16 max-w-7xl space-y-4 px-4 pb-6 text-center md:px-6 lg:px-8">
      {meta && (
        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1.5 text-[11px] text-zinc-500">
          <BookOpen className="h-3 w-3 text-violet-300/70" />
          <span>Catalog: {monthYear}</span>
          <span className="text-zinc-700">·</span>
          <span className="tabular">{meta.hoseCount?.toLocaleString() || ""} parts</span>
          {meta.source && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="truncate font-mono text-[10px] text-zinc-600" title={meta.source}>
                {meta.source}
              </span>
            </>
          )}
        </div>
      )}
      <div className="space-y-0.5 pt-2">
        <div className="text-[10px] uppercase tracking-[0.32em] text-zinc-500">HoseFinder</div>
        <div className="text-[9px] tracking-[0.18em] text-zinc-600">
          a premium build tool for Gates molded coolant hoses
        </div>
      </div>
    </footer>
  );
}
