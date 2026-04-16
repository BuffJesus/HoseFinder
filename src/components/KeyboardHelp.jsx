// Keyboard shortcut cheat sheet. Static row list — the actual handler is
// registered in CoolantHoseFinder; keep this in sync when you add a hotkey.

import React from "react";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Kbd } from "./primitives.jsx";

const ROWS = [
  { keys: ["/"],   label: "Focus part-number search" },
  { keys: ["S"],   label: "Toggle shortlist sheet" },
  { keys: ["C"],   label: "Toggle compare sheet" },
  { keys: ["1"],   label: "Grid view" },
  { keys: ["2"],   label: "List view" },
  { keys: ["3"],   label: "Compact view" },
  { keys: ["G"],   label: "Scroll to top" },
  { keys: ["?"],   label: "Show this help" },
  { keys: ["Esc"], label: "Close modals" },
];

/** @param {{ open: boolean, onClose: () => void }} props */
export function KeyboardHelp({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
        <div
          className="relative overflow-hidden rounded-t-[32px] border-b border-white/5 px-6 pt-7 pb-5"
          style={{
            background:
              "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.18), transparent 60%)," +
              "linear-gradient(180deg, rgba(20,20,28,0.6), rgba(9,9,11,0))",
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
              <Keyboard className="h-3 w-3" />
              Power user
            </div>
            <DialogTitle className="mt-1.5 text-2xl font-semibold tracking-tight text-white">
              Keyboard shortcuts
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Press <Kbd>?</Kbd> any time to bring this back.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="space-y-1.5">
            {ROWS.map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <span className="text-sm text-zinc-300">{r.label}</span>
                <span className="flex items-center gap-1">
                  {r.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
