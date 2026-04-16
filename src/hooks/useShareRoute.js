// `#/share?...` deep link for project import. Parses the hash on mount +
// every hashchange so a pasted link surfaces the import dialog without a
// reload. The actual project-creation work is delegated to
// `addImportedProject(payload) => boolean` so this hook stays free of the
// project store internals.

import { useCallback, useEffect, useState } from "react";
import { Share2, Bookmark } from "lucide-react";
import { encodeProjectShare, parseShareHash } from "../lib/roles.js";

/**
 * @param {{
 *   projects: any[],
 *   addImportedProject: (payload: any) => boolean,
 *   pushToast: (message: string, opts?: any) => void,
 * }} opts
 */
export function useShareRoute({ projects, addImportedProject, pushToast }) {
  const [sharePayload, setSharePayload] = useState(() => parseShareHash());

  useEffect(() => {
    const onHash = () => setSharePayload(parseShareHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const closeShareImport = useCallback(() => {
    if (window.location.hash.startsWith("#/share")) {
      window.history.pushState(null, "", window.location.pathname + window.location.search);
    }
    setSharePayload(null);
  }, []);

  const shareProjectUrl = useCallback((projectId) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}${encodeProjectShare(proj)}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => pushToast("Share link copied to clipboard", { icon: Share2 }),
        () => pushToast("Couldn't copy — select the URL bar manually", { tone: "warning" }),
      );
    } else {
      pushToast(url.slice(0, 60) + (url.length > 60 ? "…" : ""), { duration: 6000, icon: Share2 });
    }
  }, [projects, pushToast]);

  const importSharedProject = useCallback(() => {
    if (!sharePayload) return;
    const ok = addImportedProject(sharePayload);
    if (ok) {
      closeShareImport();
      pushToast(`Imported "${sharePayload.name}"`, { icon: Bookmark });
    }
  }, [sharePayload, addImportedProject, closeShareImport, pushToast]);

  return { sharePayload, closeShareImport, shareProjectUrl, importSharedProject };
}
