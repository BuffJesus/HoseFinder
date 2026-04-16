// Alternate top-level layout that renders when the URL resolves to
// `#/project/:id`. Mounted as an early-return from CoolantHoseFinder so
// the main wizard/results surface is entirely skipped — this is a full
// page-takeover for BOM editing.
//
// The surface wraps ProjectOverview with the same dark theme chrome and
// toast viewport the main page uses, plus a ShareImportDialog mount so a
// pasted share link still triggers the import prompt while the user is
// viewing a project.

import React from "react";
import { UnitContext } from "../context/unit.jsx";
import { ToastViewport } from "./ToastViewport.jsx";
import { ProjectOverview } from "./ProjectOverview.jsx";
import { ShareImportDialog } from "./ShareImportDialog.jsx";

/**
 * @param {{
 *   viewing: any,
 *   unitMode: "in" | "mm",
 *   allHoses: any[],
 *   toasts: any[],
 *   onBack: () => void,
 *   onRename: (id: string, name: string) => void,
 *   onRemoveHose: (partNo: string) => void,
 *   onUpdateNote: (partNo: string, text: string) => void,
 *   onUpdateRole: (partNo: string, role: string | null) => void,
 *   onDismissBanner: () => void,
 *   onClearNotes: () => void,
 *   onShare: () => void,
 *   sharePayload: any,
 *   onImportShare: any,
 *   onCloseShareImport: () => void,
 * }} props
 */
export function ProjectBomRoute({
  viewing, unitMode, allHoses, toasts,
  onBack, onRename, onRemoveHose, onUpdateNote, onUpdateRole,
  onDismissBanner, onClearNotes, onShare,
  sharePayload, onImportShare, onCloseShareImport,
}) {
  return (
    <UnitContext.Provider value={unitMode}>
      <div className="dark" style={{ colorScheme: "dark" }}>
        <div className="app-surface min-h-screen text-zinc-100">
          <div className="grain" aria-hidden="true" />
          <ToastViewport toasts={toasts} />
          <ProjectOverview
            project={viewing}
            hoses={allHoses}
            onBack={onBack}
            onRename={onRename}
            onRemoveHose={onRemoveHose}
            onUpdateNote={onUpdateNote}
            onUpdateRole={onUpdateRole}
            onDismissBanner={onDismissBanner}
            onClearNotes={onClearNotes}
            onShare={onShare}
          />
          <ShareImportDialog
            open={!!sharePayload}
            payload={sharePayload}
            hoses={allHoses}
            onImport={onImportShare}
            onClose={onCloseShareImport}
          />
        </div>
      </div>
    </UnitContext.Provider>
  );
}
