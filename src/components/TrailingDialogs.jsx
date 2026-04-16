// Bundle of mount points for every modal/dialog the main page owns. Each
// is a thin wiring component that reads its own open state + callbacks
// from props — no coupling between dialogs. Keeping them here collapses
// ~60 lines of repetitive JSX out of CoolantHoseFinder.jsx and gives
// future dialogs a single drop-in location.

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { ProjectManager } from "./ProjectManager.jsx";
import { ShareImportDialog } from "./ShareImportDialog.jsx";
import { SimilarShapeSheet } from "./SimilarShapeSheet.jsx";
import { PhotoMeasureDialog } from "./PhotoMeasureDialog.jsx";
import { BendBuilderDialog } from "./BendBuilderDialog.jsx";
import { WirePhotoDialog } from "./WirePhotoDialog.jsx";
import { CompareModal } from "./CompareModal.jsx";
import { DetailModal } from "./DetailModal.jsx";

/**
 * @param {{
 *   allHoses: any[],
 *   onSelect: (h: any) => void,
 *
 *   projectManager: {
 *     open: boolean, onClose: () => void,
 *     projects: any[], activeId: string,
 *     onSwitch: (id: string) => void, onRename: (id: string, name: string) => void,
 *     onCreate: (name: string, seed?: string[]) => void,
 *     onDuplicate: (id: string) => void, onDelete: (id: string) => void,
 *     onOpenBom: (id: string) => void,
 *   },
 *   shareImport: {
 *     payload: any, onImport: any, onClose: () => void,
 *   },
 *   similarShape: {
 *     target: any, onClose: () => void,
 *   },
 *   photoMeasure: {
 *     open: boolean, onClose: () => void, onApply: (f: string, inches: string) => void,
 *   },
 *   bendBuilder: {
 *     open: boolean, onClose: () => void,
 *   },
 *   wirePhoto: {
 *     open: boolean, onClose: () => void,
 *   },
 *   compareModal: {
 *     open: boolean, onClose: () => void,
 *     hoses: any[], onRemove: (partNo: string) => void,
 *   },
 *   detailModal: {
 *     hose: any, onClose: () => void,
 *     suggestions: any[], onShowRow: (rowNo: number) => void,
 *     onFindSimilar: (h: any) => void,
 *     rowCount: number, rowMeta: any,
 *     shortlist: Set<string>, toggleShortlist: (partNo: string) => void,
 *     compare: string[], toggleCompare: (partNo: string) => void,
 *     pairSuggestions: any[], onDisablePairing: () => void,
 *   },
 * }} props
 */
export function TrailingDialogs({
  allHoses, onSelect,
  projectManager, shareImport, similarShape,
  photoMeasure, bendBuilder, wirePhoto, compareModal, detailModal,
}) {
  return (
    <>
      <ProjectManager
        open={projectManager.open}
        onClose={projectManager.onClose}
        projects={projectManager.projects}
        activeId={projectManager.activeId}
        onSwitch={projectManager.onSwitch}
        onRename={projectManager.onRename}
        onCreate={projectManager.onCreate}
        onDuplicate={projectManager.onDuplicate}
        onDelete={projectManager.onDelete}
        onOpenBom={projectManager.onOpenBom}
      />
      <ShareImportDialog
        open={!!shareImport.payload}
        payload={shareImport.payload}
        hoses={allHoses}
        onImport={shareImport.onImport}
        onClose={shareImport.onClose}
      />
      <SimilarShapeSheet
        open={!!similarShape.target}
        target={similarShape.target}
        allHoses={allHoses}
        onClose={similarShape.onClose}
        onSelect={onSelect}
      />
      <PhotoMeasureDialog
        open={photoMeasure.open}
        onClose={photoMeasure.onClose}
        onApply={photoMeasure.onApply}
      />
      <BendBuilderDialog
        open={bendBuilder.open}
        onClose={bendBuilder.onClose}
        allHoses={allHoses}
        onSelect={onSelect}
      />
      <WirePhotoDialog
        open={wirePhoto.open}
        onClose={wirePhoto.onClose}
        allHoses={allHoses}
        onSelect={onSelect}
      />
      <CompareModal
        open={compareModal.open}
        onClose={compareModal.onClose}
        hoses={compareModal.hoses}
        onRemove={compareModal.onRemove}
        onSelect={(hose) => { compareModal.onClose(); onSelect(hose); }}
      />
      <Dialog open={!!detailModal.hose} onOpenChange={(open) => !open && detailModal.onClose()}>
        <DetailModal
          hose={detailModal.hose}
          onClose={detailModal.onClose}
          suggestions={detailModal.suggestions}
          onSelect={onSelect}
          onShowRow={detailModal.onShowRow}
          onFindSimilar={detailModal.onFindSimilar}
          rowCount={detailModal.rowCount}
          rowMeta={detailModal.rowMeta}
          shortlist={detailModal.shortlist}
          toggleShortlist={detailModal.toggleShortlist}
          compare={detailModal.compare}
          toggleCompare={detailModal.toggleCompare}
          pairSuggestions={detailModal.pairSuggestions}
          onDisablePairing={detailModal.onDisablePairing}
        />
      </Dialog>
    </>
  );
}
