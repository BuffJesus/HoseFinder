// Dialog wrapper around the standalone MeasurementGuide content.
// The guide itself is a purely presentational how-to-measure doc;
// this just puts a header on it and wires it into the Dialog shell
// so it can be opened via the "Measurement guide" hero CTA or the
// keyboard-help shortcut.

import React from "react";
import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MeasurementGuide } from "./MeasurementGuide.jsx";

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   t: (key: string) => string,
 * }} props
 */
export function MeasurementGuideDialog({ open, onOpenChange, t }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <Ruler className="h-6 w-6 text-violet-300" aria-hidden="true" /> {t("guide.title")}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">{t("guide.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="mt-3">
          <MeasurementGuide />
        </div>
      </DialogContent>
    </Dialog>
  );
}
