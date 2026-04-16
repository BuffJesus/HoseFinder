// Full-page BOM view for one project. Hash-routed via `#/project/:id`.
// Owns: project-name edit-in-place, role-group breakdown (delegates to
// RoleSection), CSV export, print-BOM HTML generation, share / missing-
// role banners.

import React, { useState } from "react";
import { ChevronRight, Edit3, Save, Share2, Info, X } from "lucide-react";
import { Printer } from "lucide-react";
import { useUnit } from "../context/unit.jsx";
import { fmtDim, MM_PER_IN } from "../lib/units.js";
import {
  ROLES, ROLE_LABEL, CANONICAL_ROLES_FOR_COMPLETE_BUILD,
  roleKey, roleDisplay,
} from "../lib/roles.js";
import { RoleSection } from "./RoleSection.jsx";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   project: any,
 *   hoses: any[],
 *   onBack: () => void,
 *   onRename: (id: string, name: string) => void,
 *   onRemoveHose: (partNo: string) => void,
 *   onUpdateNote: (partNo: string, text: string) => void,
 *   onUpdateRole: (partNo: string, role: string|null) => void,
 *   onDismissBanner: () => void,
 *   onClearNotes: () => void,
 *   onShare?: () => void,
 * }} props
 */
export function ProjectOverview({ project, hoses, onBack, onRename, onRemoveHose, onUpdateNote, onUpdateRole, onDismissBanner, onClearNotes, onShare }) {
  const unitMode = useUnit();
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-lg font-semibold text-white">Project not found</div>
        <p className="mt-2 text-sm text-zinc-400">This project may have been deleted.</p>
        <button
          type="button"
          onClick={onBack}
          className={`mt-6 inline-flex items-center gap-2 rounded-2xl border-0 bg-gradient-to-r ${ACCENT} px-4 py-2 text-sm font-semibold text-white`}
        >
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to finder
        </button>
      </div>
    );
  }

  const partSet = new Set(project.partNos);
  const items = hoses.filter((h) => partSet.has(h.partNo));
  const missing = project.partNos.filter((p) => !items.some((h) => h.partNo === p));
  const totalLengthIn = items.reduce((sum, h) => sum + (h.length || 0), 0);
  const totalLenStr = unitMode === "mm"
    ? `${(totalLengthIn * MM_PER_IN).toFixed(0)} mm`
    : `${totalLengthIn.toFixed(1)}"`;
  const notes = project.notes || {};
  const roles = project.roles || {};

  const grouped = (() => {
    const by = new Map();
    const unassigned = [];
    for (const h of items) {
      const k = roleKey(roles[h.partNo]);
      if (!k) { unassigned.push(h); continue; }
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(h);
    }
    const ordered = [];
    for (const r of ROLES) {
      if (by.has(r.key)) ordered.push({ key: r.key, label: r.label, hoses: by.get(r.key) });
    }
    if (unassigned.length) ordered.push({ key: "_unassigned", label: "Unassigned", hoses: unassigned });
    return ordered;
  })();

  const assignedRoleKeys = new Set(Object.values(roles).map(roleKey).filter(Boolean));
  const missingCanonical = CANONICAL_ROLES_FOR_COMPLETE_BUILD.filter((k) => !assignedRoleKeys.has(k));
  const showMissingBanner = items.length >= 3 && missingCanonical.length > 0 && !project.dismissedMissingBanner;

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== project.name) onRename(project.id, trimmed);
    setEditingName(false);
  };

  function exportCsv() {
    const header = ["Part", "Role", "I.D.", "Length", "Type", "Shape", "Notes"];
    const rows = items.map((h) => [
      h.partNo,
      roleDisplay(roles[h.partNo]),
      fmtDim(h.hoseId, unitMode),
      fmtDim(h.length, unitMode),
      h.hoseType,
      h.visualFamily,
      (notes[h.partNo] || "").replace(/\s+/g, " ").trim(),
    ]);
    const escape = (v) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9_-]+/gi, "_") || "project"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function printBom() {
    if (items.length === 0) return;
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const sections = grouped.map((g) => {
      const rows = g.hoses.map((h) => `
        <tr>
          <td>${esc(h.partNo)}</td>
          <td>${esc(fmtDim(h.hoseId, unitMode))}</td>
          <td>${esc(fmtDim(h.length, unitMode))}</td>
          <td>${esc(h.hoseType)}</td>
          <td>${esc(h.visualFamily)}</td>
          <td>${esc(notes[h.partNo] || "")}</td>
        </tr>
      `).join("");
      return `
        <tr class="section"><td colspan="6">${esc(g.label)} · ${g.hoses.length}</td></tr>
        ${rows}
      `;
    }).join("");
    const html = `<!DOCTYPE html>
    <html><head><meta charset="utf-8" />
      <title>${esc(project.name)} — BOM</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
        h1 { margin: 0 0 4px; font-size: 22px; }
        .sub { margin: 0 0 20px; color: #4b5563; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d1d5db; padding: 9px 12px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
        tr.section td { background: #eef2ff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #3730a3; }
        tfoot td { font-weight: 600; background: #f9fafb; }
        @media print { body { padding: 12px; } }
      </style></head><body>
      <h1>${esc(project.name)}</h1>
      <p class="sub">Gates molded coolant hose parts list · ${items.length} part${items.length === 1 ? "" : "s"} · Generated ${new Date().toLocaleDateString()}</p>
      <table>
        <thead><tr><th>Part #</th><th>I.D.</th><th>Length</th><th>Type</th><th>Shape</th><th>Notes</th></tr></thead>
        <tbody>${sections}</tbody>
        <tfoot><tr><td colspan="2">Total length</td><td colspan="4">${esc(totalLenStr)}</td></tr></tfoot>
      </table>
    </body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Back to finder
        </button>
        <div className="flex items-center gap-2">
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 transition hover:border-violet-400/30 hover:text-white disabled:opacity-40"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 transition hover:border-violet-400/30 hover:text-white disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={printBom}
            disabled={items.length === 0}
            className={`inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r ${ACCENT} px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.55)] transition hover:shadow-[0_12px_30px_-8px_rgba(217,70,239,0.6)] disabled:opacity-40 disabled:shadow-none`}
          >
            <Printer className="h-3.5 w-3.5" /> Print BOM
          </button>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 p-6 backdrop-blur-xl"
        style={{
          background:
            "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.12), transparent 60%)," +
            "linear-gradient(180deg, rgba(20,20,28,0.7), rgba(10,10,15,0.7))",
        }}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-60`} />
        <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Project</div>
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              else if (e.key === "Escape") setEditingName(false);
            }}
            maxLength={60}
            className="mt-1 w-full rounded-xl border border-violet-400/40 bg-black/40 px-3 py-1.5 text-2xl font-semibold text-white focus:border-violet-400 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setNameDraft(project.name); setEditingName(true); }}
            className="group mt-1 flex items-center gap-2 text-left"
            aria-label="Edit project name"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-white">{project.name}</h1>
            <Edit3 className="h-4 w-4 text-zinc-500 opacity-0 transition group-hover:opacity-100" />
          </button>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Parts</div>
            <div className="mt-0.5 text-lg font-semibold tabular text-white">{items.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Total length</div>
            <div className="mt-0.5 text-lg font-semibold tabular text-white">{totalLenStr}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Created</div>
            <div className="mt-0.5 text-sm font-medium text-white">{new Date(project.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">With notes</div>
            <div className="mt-0.5 text-lg font-semibold tabular text-white">
              {items.filter((h) => (notes[h.partNo] || "").trim()).length}
              {Object.values(notes).some((n) => (n || "").trim()) && (
                <button
                  type="button"
                  onClick={onClearNotes}
                  title="Clear all notes"
                  className="ml-2 text-[10px] uppercase tracking-wide text-zinc-500 hover:text-red-300"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-100">
          <span className="font-semibold">Heads up:</span> {missing.length} part{missing.length === 1 ? "" : "s"} in this project ({missing.join(", ")}) aren't in the current catalog.
        </div>
      )}

      {showMissingBanner && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-400/25 bg-sky-500/8 p-3 text-xs text-sky-100">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold">Typical builds include:</span>{" "}
            {missingCanonical.map((k) => ROLE_LABEL[k]).join(" · ")}.{" "}
            No hose in this project is assigned that role yet — worth checking you haven't missed one.
          </div>
          <button
            type="button"
            onClick={onDismissBanner}
            aria-label="Dismiss"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sky-200 transition hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {items.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="text-sm text-zinc-300">No parts in this project yet.</div>
            <p className="mt-1 text-xs text-zinc-500">Go back to the finder, shortlist some hoses, and they'll land here.</p>
          </div>
        ) : grouped.map((group) => (
          <RoleSection
            key={group.key}
            group={group}
            notes={notes}
            roles={roles}
            onRemoveHose={onRemoveHose}
            onUpdateNote={onUpdateNote}
            onUpdateRole={onUpdateRole}
            projectName={project.name}
          />
        ))}
      </div>
    </div>
  );
}
