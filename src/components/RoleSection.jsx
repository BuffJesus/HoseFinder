// A collapsible BOM section for one role group (e.g. "Upper radiator" /
// "Heater feed" / "Unassigned"). Each row lets the user change the role
// via <select>, enter a custom role label, write per-hose notes, or remove
// the hose from the project.

import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Dim } from "../context/unit.jsx";
import { ROLES } from "../lib/roles.js";

/**
 * @typedef {{ key: string, label: string, hoses: any[] }} RoleGroup
 *
 * @param {{
 *   group: RoleGroup,
 *   notes: Record<string, string>,
 *   roles: Record<string, string>,
 *   onRemoveHose: (partNo: string) => void,
 *   onUpdateNote: (partNo: string, text: string) => void,
 *   onUpdateRole: (partNo: string, role: string | null) => void,
 *   projectName: string,
 * }} props
 */
export function RoleSection({ group, notes, roles, onRemoveHose, onUpdateNote, onUpdateRole, projectName }) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-left transition hover:bg-white/[0.05]"
      >
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition ${open ? "" : "-rotate-90"}`} />
        <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${group.key === "_unassigned" ? "text-amber-300/80" : "text-violet-300/80"}`}>
          {group.label}
        </span>
        <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular text-zinc-200">
          {group.hoses.length}
        </span>
      </button>
      {open && (
        <div className="mt-2.5 space-y-2.5">
          {group.hoses.map((h) => {
            const raw = roles[h.partNo] || "";
            const isCustom = raw === "custom" || raw.startsWith("custom:");
            const customText = isCustom ? raw.replace(/^custom:?/, "") : "";
            return (
              <div
                key={h.partNo}
                className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-violet-400/25 hover:bg-white/[0.06]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Part</div>
                    <div className="mt-0.5 text-xl font-semibold tabular text-white">{h.partNo}</div>
                    <div className="mt-1 text-xs text-zinc-400">{h.visualFamily} · <span className="capitalize">{h.hoseType}</span></div>
                  </div>
                  <div className="flex items-center gap-3 tabular text-sm">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">I.D.</div>
                      <div className="font-semibold text-white"><Dim value={h.hoseId} /></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Length</div>
                      <div className="font-semibold text-white"><Dim value={h.length} /></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveHose(h.partNo)}
                      aria-label={`Remove ${h.partNo} from ${projectName}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Role</span>
                  <select
                    aria-label={`Role for ${h.partNo}`}
                    value={isCustom ? "custom" : raw}
                    onChange={(e) => {
                      const next = e.target.value;
                      onUpdateRole(h.partNo, next || null);
                    }}
                    className="rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-xs text-zinc-100 focus:border-violet-400/50 focus:outline-none"
                  >
                    <option value="">— unassigned —</option>
                    {ROLES.map((r) => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                  {isCustom && (
                    <input
                      type="text"
                      aria-label={`Custom role name for ${h.partNo}`}
                      value={customText}
                      maxLength={40}
                      placeholder="Custom role name…"
                      onChange={(e) => {
                        const text = e.target.value;
                        onUpdateRole(h.partNo, text ? `custom:${text}` : "custom");
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none"
                    />
                  )}
                </div>
                <textarea
                  aria-label={`Notes for ${h.partNo}`}
                  value={notes[h.partNo] || ""}
                  onChange={(e) => onUpdateNote(h.partNo, e.target.value)}
                  placeholder="Notes — cut length, routing, torque, fit..."
                  rows={1}
                  maxLength={400}
                  className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/40 focus:outline-none print:hidden"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
