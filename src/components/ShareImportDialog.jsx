// Review-before-import dialog for an incoming `#/share` URL. Shows every
// part number in the payload, flags any that aren't in the current
// catalogue (imported anyway, flagged in the BOM), and never overwrites
// an existing project — imports always land as a new project.

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Dim } from "../context/unit.jsx";
import { ROLE_LABEL } from "../lib/roles.js";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   open: boolean,
 *   payload: import("../lib/roles.js").SharePayload | null,
 *   hoses: any[],
 *   onImport: () => void,
 *   onClose: () => void,
 * }} props
 */
export function ShareImportDialog({ open, payload, hoses, onImport, onClose }) {
  if (!payload) return null;
  const catalogSet = new Set(hoses.map((h) => h.partNo));
  const resolved = payload.partNos.map((p) => ({
    partNo: p,
    hose: hoses.find((h) => h.partNo === p),
    role: payload.roles[p] || null,
    missing: !catalogSet.has(p),
  }));
  const missingCount = resolved.filter((r) => r.missing).length;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[28px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
        <div className="px-5 pb-5 pt-6">
          <DialogHeader>
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Shared project</div>
            <DialogTitle className="mt-1 text-xl font-semibold text-white">
              Import "{payload.name}"?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {resolved.length} part{resolved.length === 1 ? "" : "s"} from a shared link.
              Imports as a new project — never overwrites an existing one.
            </DialogDescription>
          </DialogHeader>

          {missingCount > 0 && (
            <div className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-100">
              <span className="font-semibold">{missingCount} part{missingCount === 1 ? "" : "s"}</span>{" "}
              from this link aren't in the current catalog. They'll be imported anyway and flagged in the BOM.
            </div>
          )}

          <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
            {resolved.map((r) => (
              <li key={r.partNo} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs">
                <span className={`inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${r.missing ? "bg-amber-400" : "bg-violet-400"}`} />
                <span className="tabular font-semibold text-white">{r.partNo}</span>
                {r.hose && (
                  <span className="tabular text-zinc-400">· <Dim value={r.hose.hoseId} /> · <Dim value={r.hose.length} /></span>
                )}
                {r.role && (
                  <span className="ml-auto rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-200">
                    {ROLE_LABEL[r.role]}
                  </span>
                )}
                {r.missing && <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-200">not in catalog</span>}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onImport}
              className={`inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r ${ACCENT} px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.5)]`}
            >
              Import as new project
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
