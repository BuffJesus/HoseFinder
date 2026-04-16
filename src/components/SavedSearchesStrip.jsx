// Row of saved-search pills above the results, with quick save + share-link
// actions on the right when there's an active filter set to preserve.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Trash2, Save, Share2 } from "lucide-react";

/**
 * @typedef {{ id: string, name: string }} SavedSearch
 * @param {{
 *   items: SavedSearch[],
 *   onApply: (s: SavedSearch) => void,
 *   onRemove: (id: string) => void,
 *   onSave: () => void,
 *   onShare: () => void,
 *   canSave: boolean,
 * }} props
 */
export function SavedSearchesStrip({ items, onApply, onRemove, onSave, onShare, canSave }) {
  if (items.length === 0 && !canSave) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mb-3 flex flex-wrap items-center gap-2"
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
        <Bookmark className="h-3 w-3" /> Saved
      </span>
      <AnimatePresence initial={false}>
        {items.map((s) => (
          <motion.span
            key={s.id}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="group inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] py-1 pl-2.5 pr-1 text-xs text-zinc-200 transition hover:border-violet-400/30 hover:bg-white/[0.07]"
          >
            <button
              type="button"
              onClick={() => onApply(s)}
              className="font-medium transition hover:text-white"
              title="Apply this saved search"
            >
              {s.name}
            </button>
            <button
              type="button"
              onClick={() => onRemove(s.id)}
              aria-label={`Remove saved search ${s.name}`}
              className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      {canSave && (
        <>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-100 transition hover:border-violet-400/50 hover:bg-violet-500/20"
          >
            <Save className="h-3 w-3" />
            Save current
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-violet-400/30 hover:bg-white/[0.07] hover:text-white"
          >
            <Share2 className="h-3 w-3" />
            Share link
          </button>
        </>
      )}
    </motion.div>
  );
}
