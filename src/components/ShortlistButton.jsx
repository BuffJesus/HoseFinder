// Save/saved toggle used on every hose card. Active state becomes the
// brand gradient; inactive is a subtle outline. `showLabel` false collapses
// to icon-only for tight rows (e.g. compact table).

import React from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";

/**
 * @param {{
 *   active: boolean,
 *   onClick: (e: React.MouseEvent) => void,
 *   className?: string,
 *   showLabel?: boolean,
 * }} props
 */
export function ShortlistButton({ active, onClick, className = "", showLabel = true }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={active
        ? `rounded-2xl border-0 bg-gradient-to-r ${ACCENT} text-white ${className}`.trim()
        : `rounded-2xl border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 ${className}`.trim()
      }
    >
      <Bookmark className={`h-4 w-4 ${active ? "fill-current" : ""} ${showLabel ? "mr-1.5" : ""}`.trim()} />
      {showLabel ? (active ? "Saved" : "Save") : null}
    </Button>
  );
}
