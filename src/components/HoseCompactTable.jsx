// Compact view — pure scannable table. No images, everything in one line.
// Row click opens the detail modal; icon actions on the right are
// `stopPropagation`-guarded so the table row click still reaches through.

import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchBadge, Viewer360Icon } from "./primitives.jsx";
import { GapOneLiner } from "./GapOneLiner.jsx";
import { ShortlistButton } from "./ShortlistButton.jsx";
import { Dim } from "../context/unit.jsx";
import { gatesUrl, gates360Url } from "../lib/gatesUrls.js";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   hoses: any[],
 *   onSelect: (hose: any) => void,
 *   shortlist: Set<string>,
 *   toggleShortlist: (partNo: string) => void,
 *   onShowRow: (rowNo: number) => void,
 *   rowCounts: Record<number, number>,
 * }} props
 */
export function HoseCompactTable({ hoses, onSelect, shortlist, toggleShortlist, onShowRow, rowCounts }) {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-white/10 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(20,20,28,0.78), rgba(10,10,16,0.78))",
        boxShadow:
          "0 16px 50px -18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-60`} />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-zinc-200">
          <thead>
            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.22em] text-zinc-400 backdrop-blur-xl">
              <th scope="col" className="px-4 py-3 font-semibold">Part</th>
              <th scope="col" className="px-4 py-3 font-semibold">I.D.</th>
              <th scope="col" className="px-4 py-3 font-semibold">Length</th>
              <th scope="col" className="px-4 py-3 font-semibold">Type</th>
              <th scope="col" className="px-4 py-3 font-semibold">Shape</th>
              <th scope="col" className="px-4 py-3 font-semibold">Fit</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hoses.map((hose, i) => {
              const inShortlist = shortlist.has(hose.partNo);
              return (
                <motion.tr
                  key={hose.partNo}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.008, 0.10), duration: 0.18 }}
                  onClick={() => onSelect(hose)}
                  className="group relative cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-violet-500/[0.06]"
                >
                  <td className="relative px-4 py-3.5">
                    <span className={`pointer-events-none absolute inset-y-2 left-0 w-[2px] rounded-r-full bg-gradient-to-b ${ACCENT} opacity-0 transition-opacity group-hover:opacity-100`} />
                    <div className="font-semibold text-white tabular tracking-tight">{hose.partNo}</div>
                    <div className="text-xs text-zinc-400 tabular">Row {hose.rowNo}</div>
                  </td>
                  <td className="px-4 py-3.5 tabular"><Dim value={hose.hoseId} /></td>
                  <td className="px-4 py-3.5 tabular"><Dim value={hose.length} /></td>
                  <td className="px-4 py-3.5 capitalize">{hose.hoseType}</td>
                  <td className="max-w-[18rem] truncate px-4 py-3.5 text-zinc-400">{hose.visualFamily}</td>
                  <td className="px-4 py-3.5">
                    <MatchBadge quality={hose._matchQuality} />
                    <GapOneLiner gap={hose._gap} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-xl px-2.5 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowRow(hose.rowNo);
                        }}
                      >
                        All <span className="ml-1 tabular">{rowCounts[hose.rowNo] || "?"}</span>
                      </Button>
                      <ShortlistButton
                        active={inShortlist}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleShortlist(hose.partNo);
                        }}
                        showLabel={false}
                        className="h-8 w-8 px-0"
                      />
                      <a
                        href={gates360Url(hose.partNo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`View ${hose.partNo} in 360° on Gates Navigate`}
                        title="View 360° on Gates"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-violet-300 transition hover:bg-violet-500/15 hover:text-white"
                      >
                        <Viewer360Icon className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={gatesUrl(hose.partNo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Search ${hose.partNo} on Gates.com`}
                        title="Search on Gates.com"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
