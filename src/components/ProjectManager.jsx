// Project list + per-row rename / duplicate / delete / open-BOM. "New
// project" is an inline disclosure — tap → name input slides in → commit
// creates. Caps are enforced via `onCreate` upstream; here we just dim the
// affordance when `projects.length >= PROJECTS_LIMIT`.

import React, { useState } from "react";
import { Check, Edit3, Copy, Trash2, Plus, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";
const PROJECTS_LIMIT = 12;

/**
 * @typedef {{ id: string, name: string, partNos: string[] }} Project
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   projects: Project[],
 *   activeId: string,
 *   onSwitch: (id: string) => void,
 *   onRename: (id: string, name: string) => void,
 *   onCreate: (name: string, seedPartNos?: string[]) => void,
 *   onDuplicate: (id: string) => void,
 *   onDelete: (id: string) => void,
 *   onOpenBom?: (id: string) => void,
 * }} props
 */
export function ProjectManager({ open, onClose, projects, activeId, onSwitch, onRename, onCreate, onDuplicate, onDelete, onOpenBom }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const atLimit = projects.length >= PROJECTS_LIMIT;

  const beginEdit = (p) => { setEditingId(p.id); setDraft(p.name); };
  const commitEdit = () => {
    if (editingId && draft.trim()) onRename(editingId, draft.trim());
    setEditingId(null);
    setDraft("");
  };
  const cancelEdit = () => { setEditingId(null); setDraft(""); };

  const commitCreate = () => {
    const name = newName.trim();
    if (!name) { setCreating(false); return; }
    onCreate(name, []);
    setNewName("");
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[28px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
        <div className="px-5 pb-5 pt-6">
          <DialogHeader>
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Projects</div>
            <DialogTitle className="mt-1 text-xl font-semibold text-white">
              Your builds
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Group shortlisted hoses by project. {projects.length}/{PROJECTS_LIMIT} used.
            </DialogDescription>
          </DialogHeader>

          <ul className="mt-4 space-y-1.5">
            {projects.map((p) => {
              const active = p.id === activeId;
              const editing = editingId === p.id;
              return (
                <li
                  key={p.id}
                  className={`group flex items-center gap-2 rounded-2xl border px-3 py-2 transition ${
                    active
                      ? "border-violet-400/35 bg-violet-500/10"
                      : "border-white/10 bg-white/[0.04] hover:border-violet-400/20 hover:bg-white/[0.07]"
                  }`}
                >
                  {editing ? (
                    <input
                      autoFocus
                      aria-label={`Rename project ${p.name}`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        else if (e.key === "Escape") cancelEdit();
                      }}
                      maxLength={40}
                      className="min-w-0 flex-1 rounded-lg border border-violet-400/40 bg-black/40 px-2 py-1 text-sm text-white focus:border-violet-400 focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => { if (!active) { onSwitch(p.id); onClose(); } }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${active ? `bg-gradient-to-br ${ACCENT}` : "bg-white/10"}`}>
                        {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium text-white">{p.name}</span>
                      <span className="ml-auto shrink-0 text-[11px] tabular text-zinc-400">{p.partNos.length}</span>
                    </button>
                  )}

                  {!editing && (
                    <div className="flex shrink-0 items-center gap-0.5">
                      {onOpenBom && (
                        <button
                          type="button"
                          onClick={() => onOpenBom(p.id)}
                          aria-label={`Open BOM for ${p.name}`}
                          title="Open BOM"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => beginEdit(p)}
                        aria-label={`Rename ${p.name}`}
                        title="Rename"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicate(p.id)}
                        disabled={atLimit}
                        aria-label={`Duplicate ${p.name}`}
                        title={atLimit ? "Project limit reached" : "Duplicate"}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        aria-label={`Delete ${p.name}`}
                        title="Delete"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-red-500/15 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {creating ? (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/8 p-2">
              <input
                autoFocus
                aria-label="New project name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={commitCreate}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitCreate();
                  else if (e.key === "Escape") { setNewName(""); setCreating(false); }
                }}
                maxLength={40}
                placeholder="e.g. OM606 → C10 cooling"
                className="min-w-0 flex-1 rounded-lg border border-violet-400/40 bg-black/40 px-2 py-1 text-sm text-white focus:border-violet-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={commitCreate}
                className={`inline-flex h-8 items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} px-3 text-xs font-semibold text-white`}
              >
                Create
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              disabled={atLimit}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-xs text-zinc-300 transition hover:border-violet-400/30 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> New project
              {atLimit && <span className="text-zinc-400">· limit reached</span>}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
