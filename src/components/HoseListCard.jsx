// List-view hose card — horizontal layout: silhouette thumb on the left,
// all specs + actions on the right. Shown in "list" density, mobile-friendly.

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "./primitives.jsx";
import { ShortlistButton } from "./ShortlistButton.jsx";
import { HoseImage } from "./HoseImage.jsx";
import { GapExplainer } from "./GapExplainer.jsx";
import { Dim } from "../context/unit.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   hose: any,
 *   onSelect: (hose: any) => void,
 *   shortlist: Set<string>,
 *   toggleShortlist: (partNo: string) => void,
 *   onShowRow: (rowNo: number) => void,
 *   onFindSimilar?: (hose: any) => void,
 *   rowCount?: number,
 *   idx?: number,
 * }} props
 */
export function HoseListCard({ hose, onSelect, shortlist, toggleShortlist, onShowRow, onFindSimilar, rowCount, idx }) {
  const inShortlist = shortlist.has(hose.partNo);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min((idx || 0) * 0.012, 0.14), duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group overflow-hidden rounded-[28px] border border-white/10 bg-zinc-900 text-zinc-100 shadow-[0_16px_60px_-24px_rgba(139,92,246,0.3)] transition-[border-color,box-shadow] duration-300 hover:border-violet-400/25 hover:shadow-[0_22px_70px_-24px_rgba(139,92,246,0.45)]">
        <div className={`accent-shimmer h-1 bg-gradient-to-r ${ACCENT}`} />
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-3 lg:w-48 lg:shrink-0">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                <span>{hose.hoseType}</span>
                <span>Row {hose.rowNo}</span>
              </div>
              <HoseImage
                partNo={hose.partNo}
                catalogPage={hose.catalogPage}
                silhouette={hose.silhouette}
                className="h-24"
                imgClassName="h-full w-auto max-w-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-2xl font-semibold text-white tabular tracking-tight">{hose.partNo}</div>
                    <MatchBadge quality={hose._matchQuality} />
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">{hose.visualFamily}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:min-w-[24rem]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">I.D.</div>
                    <div className="mt-1 font-semibold text-white tabular"><Dim value={hose.hoseId} /></div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Length</div>
                    <div className="mt-1 font-semibold text-white tabular"><Dim value={hose.length} /></div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Type</div>
                    <div className="mt-1 font-semibold capitalize text-white">{hose.hoseType}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Shape</div>
                    <div className="mt-1 truncate font-semibold text-white tabular">{rowCount || "?"} in row</div>
                  </div>
                </div>
              </div>

              {hose._gap && (hose._gap.idHasTgt || hose._gap.lenHasTgt) && (
                <div className="mt-3">
                  <GapExplainer gap={hose._gap} />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => onSelect(hose)}
                  className={`rounded-2xl bg-gradient-to-r ${ACCENT} text-white shadow-lg shadow-violet-950/40 hover:opacity-90`}
                >
                  View details
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onShowRow(hose.rowNo)}
                  className="rounded-2xl text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  All {rowCount || "?"} in this shape
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onFindSimilar?.(hose)}
                  className="rounded-2xl text-xs text-zinc-400 hover:bg-white/5 hover:text-violet-200"
                >
                  <Sparkles className="mr-1 h-3 w-3" /> Find similar
                </Button>
                <ShortlistButton
                  active={inShortlist}
                  onClick={() => toggleShortlist(hose.partNo)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
