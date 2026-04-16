// Grid-view hose card — headline part number + silhouette + the three
// primary specs + CTAs. Used in the default "grid" density. Also exports
// a matching skeleton for the loading state.

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchBadge, Viewer360Icon } from "./primitives.jsx";
import { ShortlistButton } from "./ShortlistButton.jsx";
import { HoseImage } from "./HoseImage.jsx";
import { Dim } from "../context/unit.jsx";
import { gatesUrl, gates360Url } from "../lib/gatesUrls.js";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   hose: any,
 *   shortlist: Set<string>,
 *   toggleShortlist: (partNo: string) => void,
 *   onSelect: (hose: any) => void,
 *   onShowRow: (rowNo: number) => void,
 *   onFindSimilar?: (hose: any) => void,
 *   rowCount?: number,
 *   idx?: number,
 * }} props
 */
export function HoseCard({ hose, shortlist, toggleShortlist, onSelect, onShowRow, onFindSimilar, rowCount, idx }) {
  const inShortlist = shortlist.has(hose.partNo);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min((idx || 0) * 0.015, 0.16),
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-zinc-900 text-zinc-100 shadow-[0_16px_60px_-24px_rgba(139,92,246,0.22)] transition-[border-color,box-shadow] duration-300 hover:border-violet-400/30 hover:shadow-[0_24px_80px_-24px_rgba(139,92,246,0.45)]">
        <div className={`accent-shimmer h-1 bg-gradient-to-r ${ACCENT}`} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Part number</div>
              <div className="mt-0.5 text-2xl font-semibold text-white tabular tracking-tight">{hose.partNo}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-400">{hose.visualFamily}</span>
                <MatchBadge quality={hose._matchQuality} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={gates360Url(hose.partNo)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`View ${hose.partNo} in 360° on Gates Navigate`}
                title="View 360° on Gates"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/30 bg-gradient-to-br ${ACCENT} text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.55)] transition hover:shadow-[0_8px_20px_-4px_rgba(217,70,239,0.6)]`}
              >
                <Viewer360Icon className="h-4 w-4" />
              </a>
              <a
                href={gatesUrl(hose.partNo)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Search ${hose.partNo} on Gates.com`}
                title="Search on Gates.com"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:border-violet-400/30 hover:bg-white/[0.08] hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <ShortlistButton
                active={inShortlist}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleShortlist(hose.partNo);
                }}
                showLabel={false}
                className="h-9 w-9 px-0"
              />
            </div>
          </div>

          <div
            className="relative mt-4 overflow-hidden rounded-[24px] border border-white/10 p-4 transition group-hover:border-violet-400/25"
            style={{
              background:
                "radial-gradient(20rem 12rem at 50% -20%, rgba(139,92,246,0.18), transparent 60%)," +
                "radial-gradient(16rem 10rem at 50% 120%, rgba(217,70,239,0.10), transparent 60%)," +
                "linear-gradient(180deg, #15151a, #08080b)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
            />
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              <span className="capitalize">{hose.hoseType}</span>
              <span className="tabular">Row {hose.rowNo}</span>
            </div>
            <HoseImage
              partNo={hose.partNo}
              catalogPage={hose.catalogPage}
              silhouette={hose.silhouette}
              className="h-24"
              imgClassName="h-full w-auto max-w-full object-contain transition duration-500 group-hover:scale-[1.04]"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-2xl border border-white/10 p-3 transition group-hover:border-white/15" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">I.D.</div>
              <div className="mt-0.5 font-semibold text-white tabular"><Dim value={hose.hoseId} /></div>
            </div>
            <div className="rounded-2xl border border-white/10 p-3 transition group-hover:border-white/15" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Length</div>
              <div className="mt-0.5 font-semibold text-white tabular"><Dim value={hose.length} /></div>
            </div>
            <div className="rounded-2xl border border-white/10 p-3 transition group-hover:border-white/15" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Ends</div>
              <div className="mt-0.5 font-semibold text-white capitalize tabular">{hose.hoseType === "single" ? "1" : hose.hoseType === "reducer" ? "2" : `${hose.endCount}`}</div>
            </div>
          </div>

          <Button
            onClick={() => onSelect(hose)}
            className={`mt-4 w-full rounded-2xl bg-gradient-to-r ${ACCENT} text-white shadow-lg shadow-violet-950/40 hover:opacity-90`}
          >
            View details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onShowRow(hose.rowNo); }}
              className="rounded-2xl text-[11px] text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              All <span className="mx-1 tabular text-zinc-200">{rowCount || "?"}</span> in row
            </Button>
            <Button
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onFindSimilar?.(hose); }}
              className="rounded-2xl text-[11px] text-zinc-400 hover:bg-white/5 hover:text-violet-200"
            >
              <Sparkles className="mr-1 h-3 w-3" /> Find similar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Placeholder card while the catalog JSON is loading. */
export function HoseCardSkeleton({ idx = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.32), duration: 0.32 }}
      className="overflow-hidden rounded-[30px] border border-white/10 bg-zinc-900/60 p-5"
    >
      <div className={`-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r ${ACCENT} opacity-40`} />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-2.5 w-20 rounded-full" />
          <div className="skeleton h-7 w-32 rounded-lg" />
          <div className="skeleton h-3 w-44 rounded-full" />
        </div>
        <div className="skeleton h-9 w-9 rounded-2xl" />
      </div>
      <div className="skeleton mt-4 h-24 w-full rounded-[24px]" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton mt-4 h-10 w-full rounded-2xl" />
    </motion.div>
  );
}
